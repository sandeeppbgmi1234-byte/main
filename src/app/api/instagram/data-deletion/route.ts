import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../server/db";
import { verifyAndDecodeSignedRequest } from "../../../../server/instagram/oauth/signed-request";
import { invalidateUser } from "../../../../server/redis/operations/user";
import { clogger } from "../../../../server/utils/consola";

/**
 * Handles the Data Deletion Request URL callback from Meta
 * Required for compliance. Provides a way for users to request data deletion.
 */
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const signedRequest = formData.get("signed_request")?.toString();

    if (!signedRequest) {
      clogger.warn("[Instagram:DataDeletion] Missing signed_request");
      return NextResponse.json(
        { error: "Missing signed_request" },
        { status: 400 },
      );
    }

    const payload = verifyAndDecodeSignedRequest(signedRequest);

    if (!payload || !payload.user_id) {
      clogger.error("[Instagram:DataDeletion] Invalid signed_request payload");
      return NextResponse.json(
        { error: "Invalid signed_request" },
        { status: 400 },
      );
    }

    const metaUserId = payload.user_id;
    clogger.info(
      { requestId: payload.request_id },
      "[Instagram:DataDeletion] Received data deletion request",
    );

    const account = await prisma.instaAccount.findUnique({
      where: { webhookUserId: metaUserId },
      select: {
        id: true,
        userId: true,
        user: { select: { clerkId: true } },
      },
    });

    if (account) {
      // 2. Perform FULL DELETION
      const clerkId = account.user.clerkId;

      // Find all associated accounts to purge their caches
      const userAccounts = await prisma.instaAccount.findMany({
        where: { userId: account.userId },
        select: { webhookUserId: true },
      });

      const webhookUserIds = userAccounts
        .map((a) => a.webhookUserId)
        .filter(Boolean) as string[];

      // Clear cache for all associated IDs first while data still exists
      const { purgeAllUserCaches } = await import(
        "../../../../server/redis/operations/user"
      );
      await purgeAllUserCaches(clerkId, webhookUserIds);

      // Delete the user record (triggers cascading DB delete)
      // We use deleteMany to make this operation idempotent (succeeds even if already deleted)
      await prisma.user.deleteMany({
        where: { clerkId },
      });

      clogger.info(
        { accountCount: webhookUserIds.length },
        "[Instagram:DataDeletion] Full user data purge completed",
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (!baseUrl) {
      clogger.error("[Instagram:DataDeletion] NEXT_PUBLIC_APP_URL is not set");
      return NextResponse.json(
        { error: "Configuration error" },
        { status: 500 },
      );
    }

    // 3. Return the required confirmation response format to Meta
    // Meta requires returning a URL where the user can check the status of their deletion request,
    // and an alphanumeric confirmation code.
    const confirmationCode = crypto.randomUUID().replace(/-/g, "");
    
    // Persist mapping from token for status lookups
    await prisma.dataDeletionRequest.create({
      data: {
        token: confirmationCode,
        status: "completed",
      },
    });

    const statusUrl = `${baseUrl}/deletion-status?id=${confirmationCode}`;

    return NextResponse.json({
      url: statusUrl,
      confirmation_code: confirmationCode,
    }, { status: 200 });

  } catch (error: any) {
    clogger.error(
      { error: error.message },
      "[Instagram:DataDeletion] Processing failed",
    );
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
