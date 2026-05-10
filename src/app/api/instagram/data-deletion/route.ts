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
      { payload },
      "[Instagram:DataDeletion] Received data deletion request",
    );

    // Find the associated account using webhookUserId (Meta ID corresponds to this)
    const account = await prisma.instaAccount.findUnique({
      where: { webhookUserId: metaUserId },
      select: { id: true, user: { select: { clerkId: true } } },
    });

    if (account) {
      // 2. Perform deletion logic or flag for deletion
      // For compliance, you typically delete their data or schedule it for deletion.
      // Here we will just deactivate and invalidate for now. The actual deletion
      // might be handled via a background job or cascading deletes.

      await prisma.instaAccount.update({
        where: { id: account.id },
        data: { isActive: false },
      });

      await invalidateUser(account.user.clerkId, metaUserId);
      clogger.info(
        { accountId: account.id },
        "[Instagram:DataDeletion] Account data queued for deletion/deactivated",
      );
    }

    // 3. Return the required confirmation response format to Meta
    // Meta requires returning a URL where the user can check the status of their deletion request,
    // and an alphanumeric confirmation code.
    const confirmationCode = `del_${metaUserId}_${Date.now()}`;
    const statusUrl = `${process.env.NEXT_PUBLIC_APP_URL}/deletion-status?id=${confirmationCode}`;

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
