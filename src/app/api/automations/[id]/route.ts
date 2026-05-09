import { NextRequest, NextResponse } from "next/server";
import { UpdateAutomationSchema } from "@dm-broo/common-types";
import {
  getAutomation,
  updateAutomation,
  stopAutomation,
} from "@/server/services/automations/automation.service";
import { findUserByClerkId } from "@/server/repository/user/user.repository";
import { isValidObjectId, sanitizeQueryParam } from "@/server/utils/validation";
import { runWithErrorHandling } from "@/server/middleware/errors";
import { ApiRouteError } from "@/server/middleware/errors/classes";

/**
 * GET - Retrieves a specific automation
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  return runWithErrorHandling(async ({ clerkId, instaAccountId }) => {
    const user = await findUserByClerkId(clerkId!);
    if (!user) {
      throw new ApiRouteError("User not found", "NOT_FOUND", 404);
    }

    const { id } = await params;
    const automationId = sanitizeQueryParam(id, 24);

    if (!isValidObjectId(automationId)) {
      throw new ApiRouteError(
        "Invalid automation ID format",
        "INVALID_INPUT",
        400,
      );
    }

    const automation = await getAutomation(user.id, instaAccountId!, automationId);
    return { automation };
  }, { requireWorkspace: true });
}

/**
 * PATCH - Updates an automation
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  return runWithErrorHandling(async ({ clerkId, instaAccountId }) => {
    const user = await findUserByClerkId(clerkId!);
    if (!user) {
      throw new ApiRouteError("User not found", "NOT_FOUND", 404);
    }

    const { id } = await params;
    const body = await request.json();
    const validation = UpdateAutomationSchema.safeParse(body);

    if (!validation.success) {
      const errorMessage =
        validation.error.issues[0]?.message || "Invalid input";
      throw new ApiRouteError(errorMessage, "INVALID_INPUT", 400);
    }

    const automation = await updateAutomation(user.id, id, instaAccountId!, validation.data);

    return { automation };
  }, { requireWorkspace: true });
}

/**
 * DELETE - Stops an automation
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  return runWithErrorHandling(async ({ clerkId, instaAccountId }) => {
    const user = await findUserByClerkId(clerkId!);
    if (!user) {
      throw new ApiRouteError("User not found", "NOT_FOUND", 404);
    }

    const { id } = await params;
    const automationId = sanitizeQueryParam(id, 24);
    if (!isValidObjectId(automationId)) {
      throw new ApiRouteError(
        "Invalid automation ID format",
        "INVALID_INPUT",
        400,
      );
    }

    const result = await stopAutomation(user.id, instaAccountId!, automationId);
    return { message: result.message };
  }, { requireWorkspace: true });
}
