import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../server/db";
import { purgeAllUserCaches } from "../../../../server/redis/operations/user";
import { clogger } from "../../../../server/utils/consola";

import { Webhook } from "svix";

/**
 * Handles Clerk Webhooks (e.g. user.deleted)
 * Ensures that when a user deletes their Clerk account, we purge their data.
 */
export async function POST(req: NextRequest) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    clogger.error("[Clerk:Webhook] CLERK_WEBHOOK_SECRET is not set");
    return NextResponse.json(
      { error: "Configuration error" },
      { status: 500 },
    );
  }

  // Get the Svix headers for verification
  const svix_id = req.headers.get("svix-id");
  const svix_timestamp = req.headers.get("svix-timestamp");
  const svix_signature = req.headers.get("svix-signature");

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    clogger.warn("[Clerk:Webhook] Missing Svix headers");
    return NextResponse.json({ error: "Missing Svix headers" }, { status: 400 });
  }

  // Get the body as text to verify the signature
  const body = await req.text();
  const wh = new Webhook(WEBHOOK_SECRET);

  let evt: any;

  // Attempt to verify the incoming webhook
  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    });
  } catch (err: any) {
    clogger.error({ error: err.message }, "[Clerk:Webhook] Verification failed");
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    const payload = evt;
    const eventType = payload.type;

    clogger.info({ eventType }, "[Clerk:Webhook] Received event");

    if (eventType === "user.deleted") {
      const clerkId = payload.data.id;

      if (!clerkId) {
        return NextResponse.json({ error: "Missing user ID" }, { status: 400 });
      }

      // 1. Find all associated Instagram accounts for cache purging
      const user = await prisma.user.findUnique({
        where: { clerkId },
        include: { instaAccounts: { select: { webhookUserId: true } } },
      });

      if (user) {
        const webhookUserIds = user.instaAccounts
          .map((a) => a.webhookUserId)
          .filter(Boolean) as string[];

        // 2. Clear Redis Caches first while data still exists
        await purgeAllUserCaches(clerkId, webhookUserIds);

        // 3. Perform idempotent FULL DELETION (Cascading)
        await prisma.user.deleteMany({
          where: { clerkId },
        });

        clogger.info(
          { accountsDeleted: webhookUserIds.length },
          "[Clerk:Webhook] User and all associated data purged successfully",
        );
      }
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    clogger.error(
      { error: error.message },
      "[Clerk:Webhook] Processing failed",
    );
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
