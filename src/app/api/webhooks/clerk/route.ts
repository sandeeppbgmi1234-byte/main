import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../server/db";
import { purgeAllUserCaches } from "../../../../server/redis/operations/user";
import { clogger } from "../../../../server/utils/consola";

/**
 * Handles Clerk Webhooks (e.g. user.deleted)
 * Ensures that when a user deletes their Clerk account, we purge their data.
 */
export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
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

        // 2. Perform FULL DELETION (Cascading)
        await prisma.user.delete({
          where: { clerkId },
        });

        // 3. Clear Redis Caches
        await purgeAllUserCaches(clerkId, webhookUserIds);

        clogger.info(
          { clerkId, accountsDeleted: webhookUserIds.length },
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
