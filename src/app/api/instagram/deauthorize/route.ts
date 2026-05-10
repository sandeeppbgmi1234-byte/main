import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../server/db";
import { verifyAndDecodeSignedRequest } from "../../../../server/instagram/oauth/signed-request";
import { invalidateUser } from "../../../../server/redis/operations/user";
import { clogger } from "../../../../server/utils/consola";

/**
 * Handles the Instagram app deauthorization callback
 * Triggered when a user removes the app from their Instagram "Apps and Websites" settings.
 * Must be a POST request and form-encoded.
 */
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const signedRequest = formData.get("signed_request")?.toString();

    if (!signedRequest) {
      clogger.warn("[Instagram:Deauthorize] Missing signed_request");
      return NextResponse.json(
        { error: "Missing signed_request" },
        { status: 400 },
      );
    }

    const payload = verifyAndDecodeSignedRequest(signedRequest);

    if (!payload || !payload.user_id) {
      clogger.error("[Instagram:Deauthorize] Invalid signed_request payload");
      return NextResponse.json(
        { error: "Invalid signed_request" },
        { status: 400 },
      );
    }

    const metaUserId = payload.user_id;
    clogger.info(
      { userId: metaUserId, object: payload.object },
      "[Instagram:Deauthorize] Received deauthorization request",
    );

    // Find the associated account using webhookUserId (Meta ID corresponds to this)
    const account = await prisma.instaAccount.findUnique({
      where: { webhookUserId: metaUserId },
      select: { id: true, isActive: true, user: { select: { clerkId: true } } },
    });

    if (!account) {
      clogger.warn(
        { metaUserId },
        "[Instagram:Deauthorize] Account not found in database",
      );
      // Meta requires a 200 response even if we don't know the user
      return NextResponse.json({ success: true }, { status: 200 });
    }

    // Set isActive to false
    if (account.isActive) {
      await prisma.instaAccount.update({
        where: { id: account.id },
        data: { isActive: false },
      });
      clogger.info(
        { accountId: account.id, metaUserId },
        "[Instagram:Deauthorize] Account marked as inactive",
      );
    }

    // Invalidate user cache to ensure the worker stops processing immediately
    await invalidateUser(account.user.clerkId, metaUserId);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    clogger.error(
      { error: error.message },
      "[Instagram:Deauthorize] Processing failed",
    );
    // Still return 200 to acknowledge receipt to Meta, but maybe a 500 is better so they retry?
    // Usually Meta endpoints prefer 200 unless it's a transient failure you want them to retry.
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
