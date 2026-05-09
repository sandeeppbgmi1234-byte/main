/**
 * Automation Service
 * Workspace-scoped — all operations are isolated to a specific instaAccountId
 */

import { ERROR_MESSAGES } from "@/server/config/instagram.config";
import type {
  CreateAutomationInput,
  UpdateAutomationInput,
} from "@dm-broo/common-types";
import { findUserByClerkId } from "@/server/repository/user/user.repository";
import {
  createAutomation as createAutomationRecord,
  findAutomationByIdAndWorkspace,
  findAutomationByIdAndWorkspaceForUpdate,
  findUserAutomations,
  updateAutomation as updateAutomationRecord,
  stopAutomation as stopAutomationRecord,
  findAutomationsByTargetAndKeywords,
} from "@/server/repository/automations/automation.repository";
import { invalidateAutomationCache } from "@/server/redis";
import { logger } from "@/server/utils/pino";
import { ApiRouteError } from "@/server/middleware/errors/classes";
import {
  AutomationFilters,
  AutomationStatus,
} from "@/api/services/automations/types";
import { prisma } from "@/server/db";
import crypto from "crypto";
import { TriggerType } from "@/api/services/automations/types";
import { getFeatureGates } from "@/server/services/billing/feature-gates";

/**
 * Helper to validate feature access for specific automation features
 */
async function validateFeatureAccess(
  clerkId: string,
  input: CreateAutomationInput | UpdateAutomationInput,
  existingEnabledState: boolean = false,
) {
  // Use the effective state (payload value OR existing DB value if omitted)
  const isAskToFollowActive = input.askToFollowEnabled ?? existingEnabledState;

  // Gate: Ask to Follow (available on FREE and BLACK only)
  if (isAskToFollowActive) {
    const gates = await getFeatureGates(clerkId);
    if (!gates.access.hasAskToFollow) {
      throw new ApiRouteError(
        "The 'Ask to Follow' feature is a special feature available on our Black and Free plans. Please upgrade to unlock.",
        "FEATURE_LOCKED",
        403,
      );
    }
  }
}

/**
 * Helper to compute the cache invalidation type from a trigger type
 */
function getInvalidateType(
  triggerType: TriggerType,
): "post" | "story" | "account" {
  switch (triggerType) {
    case "RESPOND_TO_ALL_DMS":
      return "account";
    case "STORY_REPLY":
      return "story";
    case "COMMENT_ON_POST":
    default:
      return "post";
  }
}

export function computeTriggersSignature(triggers: string[]): string {
  // Sort, JSON stringify, and SHA256 hash to create a deterministic key
  const sorted = [...triggers].sort();
  const serialized = JSON.stringify(sorted);
  return crypto.createHash("sha256").update(serialized).digest("hex");
}

/**
 * Helper to check for automation conflicts on a target (account, post, story)
 */
async function validateAutomationConflict(
  instaAccountId: string,
  triggers: string[],
  targetId: string,
  targetType: "post" | "story" | "account",
  automationId?: string,
) {
  const overlapping = await findAutomationsByTargetAndKeywords(
    instaAccountId,
    targetId,
    targetType,
    triggers,
  );

  const others = automationId
    ? overlapping.filter((a) => a.id !== automationId)
    : overlapping;

  if (others.length > 0) {
    const conflict = others[0];
    const isCatchAll = triggers.length === 0;

    const automationName = conflict.automationName || "unnamed automation";
    const message = isCatchAll
      ? `Automation "${automationName}" is already a catch-all for this ${targetType}. Only one is allowed.`
      : `Automation "${automationName}" shares keywords on this ${targetType} that match your new configuration.`;

    throw new ApiRouteError(message, "CONFLICTING_AUTOMATION", 400);
  }

  return others;
}

/**
 * Helper to ensure automation name is unique for the account
 */
async function validateAutomationName(
  instaAccountId: string,
  name: string,
  automationId?: string,
) {
  if (!name || name.trim() === "") {
    throw new ApiRouteError(
      "An automation name is required.",
      "MISSING_NAME",
      400,
    );
  }

  const result = await prisma.automation.findFirst({
    where: {
      instaAccountId,
      automationName: name,
      status: { in: ["ACTIVE", "STOPPED"] },
      ...(automationId ? { id: { not: automationId } } : {}),
    },
    select: { id: true },
  });

  if (result) {
    throw new ApiRouteError(
      `An automation with the name "${name}" already exists on this account.`,
      "DUPLICATE_NAME",
      400,
    );
  }
}

// Creates a new automation scoped to a specific workspace
export async function createAutomation(
  clerkId: string,
  instaAccountId: string,
  input: CreateAutomationInput,
) {
  const user = await findUserByClerkId(clerkId);
  if (!user) {
    throw new ApiRouteError(ERROR_MESSAGES.AUTH.NO_USER, "NO_USER");
  }

  const account = await prisma.instaAccount.findFirst({
    where: { id: instaAccountId, userId: user.id, isActive: true },
    select: { id: true },
  });

  if (!account) {
    throw new ApiRouteError(
      ERROR_MESSAGES.AUTH.NO_INSTAGRAM_ACCOUNT,
      "NO_INSTAGRAM_ACCOUNT",
    );
  }

  const triggerType = input.triggerType ?? "COMMENT_ON_POST";
  const warnings: string[] = [];

  // Feature Access Validation (Config Driven)
  await validateFeatureAccess(clerkId, input);

  // Name uniqueness check
  await validateAutomationName(instaAccountId, input.automationName);

  const targetId =
    triggerType === "RESPOND_TO_ALL_DMS"
      ? "account"
      : triggerType === "STORY_REPLY"
        ? input.story?.id
        : input.postId;
  const targetType =
    triggerType === "RESPOND_TO_ALL_DMS"
      ? "account"
      : triggerType === "STORY_REPLY"
        ? "story"
        : "post";

  if (!targetId) {
    throw new ApiRouteError(
      `A target ID (e.g. postId or storyId) is required for ${triggerType} triggers.`,
      "MISSING_TARGET",
      400,
    );
  }

  await validateAutomationConflict(
    instaAccountId,
    input.triggers,
    targetId,
    targetType,
  );

  const triggersSignature = computeTriggersSignature(input.triggers);

  let automation;
  try {
    automation = await createAutomationRecord(
      user.id,
      instaAccountId,
      input,
      triggersSignature,
    );
  } catch (err: any) {
    // Handle uniqueness constraints (e.g., duplicate name or overlapping triggers)
    if (err.code === "P2002") {
      const target = (err.meta?.target as string[]) || [];
      if (target.includes("automationName")) {
        throw new ApiRouteError(
          `An automation with the name "${input.automationName}" already exists on this account.`,
          "DUPLICATE_NAME",
          400,
        );
      }
      throw new ApiRouteError(
        "An automation with this configuration already exists. Please check for keyword overlaps.",
        "CONFLICTING_AUTOMATION",
        400,
      );
    }
    throw err;
  }

  if (!automation) {
    throw new ApiRouteError(
      "Failed to create automation. Please try again.",
      "CREATE_FAILED",
      500,
    );
  }

  // Invalidate workspace automation cache using shared helper
  const invalidateType = getInvalidateType(triggerType as TriggerType);
  const finalTargetId = targetId || "account";

  await invalidateAutomationCache(
    instaAccountId,
    finalTargetId,
    invalidateType,
    automation.id,
  ).catch((error) => {
    logger.error(
      { instaAccountId, targetId: finalTargetId, triggerType },
      "Failed to invalidate automation cache after creation",
      error instanceof Error ? error : new Error(String(error)),
    );
  });

  return {
    id: automation.id,
    triggerType: automation.triggerType,
    automationName: automation.automationName,
    createdAt: automation.createdAt,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}

// Gets a specific automation by ID (ownership enforced in the query)
export async function getAutomation(userId: string, instaAccountId: string, automationId: string) {
  const automation = await findAutomationByIdAndWorkspace(automationId, userId, instaAccountId);

  if (!automation) {
    throw new Error("Automation not found or access denied");
  }

  return {
    id: automation.id,
    triggerType: automation.triggerType,
    automationName: automation.automationName,
    post: automation.post,
    story: automation.story,
    triggers: automation.triggers,
    matchType: automation.matchType,
    actionType: automation.actionType,
    replyMessage: automation.replyMessage,
    replyImage: automation.replyImage,
    commentReplyWhenDm: automation.commentReplyWhenDm,
    askToFollowEnabled: automation.askToFollowEnabled,
    askToFollowMessage: automation.askToFollowMessage,
    askToFollowLink: automation.askToFollowLink,
    openingMessageEnabled: automation.openingMessageEnabled,
    openingMessage: automation.openingMessage,
    openingButtonText: automation.openingButtonText,
    dmLinks: automation.dmLinks || [],
    status: automation.status,
    timesTriggered: automation.timesTriggered,
    lastTriggeredAt: automation.lastTriggeredAt,
    createdAt: automation.createdAt,
    updatedAt: automation.updatedAt,
    recentExecutions: automation.executions,
    totalExecutions: automation._count.executions,
  };
}

// Lists all automations for a specific workspace
export async function getUserAutomations(
  instaAccountId: string,
  filters?: { status?: AutomationStatus | AutomationStatus[] },
) {
  const repositoryFilters: AutomationFilters = {
    instaAccountId,
    status: filters?.status ?? ["ACTIVE", "STOPPED"],
  };

  const automations = await findUserAutomations(repositoryFilters);
  return automations.map((a) => ({ ...a, type: "automation" as const }));
}

// Updates an automation (ownership enforced in the query)
export async function updateAutomation(
  userId: string,
  automationId: string,
  instaAccountId: string,
  input: UpdateAutomationInput,
) {
  const existingAutomation = await findAutomationByIdAndWorkspaceForUpdate(
    automationId,
    userId,
    instaAccountId,
  );

  if (!existingAutomation) {
    throw new Error("Automation not found or access denied");
  }

  // Feature Access Validation (Config Driven)
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { clerkId: true },
  });
  if (user?.clerkId) {
    await validateFeatureAccess(
      user.clerkId,
      input,
      existingAutomation.askToFollowEnabled ?? false,
    );
  }


  // Conflict validation before update
  const newTriggerType =
    ((input as any).triggerType as string) ??
    (existingAutomation as any).triggerType;
  const newTriggers = input.triggers ?? (existingAutomation as any).triggers;

  const targetId =
    newTriggerType === "RESPOND_TO_ALL_DMS"
      ? "account"
      : newTriggerType === "STORY_REPLY"
        ? ((input as any).story?.id ?? (existingAutomation as any).story?.id)
        : ((input as any).postId ?? (existingAutomation as any).post?.id);

  const targetType =
    newTriggerType === "RESPOND_TO_ALL_DMS"
      ? "account"
      : newTriggerType === "STORY_REPLY"
        ? "story"
        : "post";

  // Name uniqueness and presence check (if name is provided)
  if (input.automationName !== undefined) {
    await validateAutomationName(
      instaAccountId,
      input.automationName,
      automationId,
    );
  }

  // Conflict validation before update
  if (!targetId) {
    throw new ApiRouteError(
      `A target ID (e.g. postId or storyId) is required for ${newTriggerType} triggers.`,
      "MISSING_TARGET",
      400,
    );
  }

  await validateAutomationConflict(
    (existingAutomation as any).instaAccountId,
    newTriggers,
    targetId,
    targetType,
    automationId,
  );

  let updatedAutomation;
  try {
    const triggersSignature =
      input.triggers !== undefined
        ? computeTriggersSignature(input.triggers)
        : (existingAutomation as any).triggersSignature;

    updatedAutomation = await updateAutomationRecord(automationId, {
      ...input,
      targetId,
      targetType,
      triggersSignature,
      // Explicitly clear the non-applicable target to prevent stale metadata
      post: targetType === "post" ? (input as any).post : { unset: true },
      story: targetType === "story" ? (input as any).story : { unset: true },
    } as any);
  } catch (err: any) {
    if (err.code === "P2002") {
      const target = (err.meta?.target as string[]) || [];
      if (target.includes("automationName")) {
        throw new ApiRouteError(
          `An automation with the name "${input.automationName}" already exists on this account.`,
          "DUPLICATE_NAME",
          400,
        );
      }
      throw new ApiRouteError(
        "An automation with this configuration already exists. Please check for keyword overlaps.",
        "CONFLICTING_AUTOMATION",
        400,
      );
    }
    throw err;
  }

  // Invalidate cache for BOTH old and new scopes if they differ
  const oldInvalidateType = getInvalidateType(
    existingAutomation.triggerType as TriggerType,
  );
  const oldTargetId =
    existingAutomation.post?.id ?? existingAutomation.story?.id ?? "account";

  const newInvalidateType = getInvalidateType(
    updatedAutomation.triggerType as TriggerType,
  );
  const newTargetId =
    updatedAutomation.post?.id ?? updatedAutomation.story?.id ?? "account";

  // 1. Invalidate old scope
  await invalidateAutomationCache(
    existingAutomation.instaAccountId,
    oldTargetId,
    oldInvalidateType,
    automationId,
  ).catch((error) => {
    logger.error(
      {
        instaAccountId: existingAutomation.instaAccountId,
        targetId: oldTargetId,
        automationId,
      },
      "Failed to invalidate OLD automation cache after update",
      error instanceof Error ? error : new Error(String(error)),
    );
  });

  // 2. Invalidate new scope ONLY if it's different from the old one
  if (oldTargetId !== newTargetId || oldInvalidateType !== newInvalidateType) {
    await invalidateAutomationCache(
      existingAutomation.instaAccountId,
      newTargetId,
      newInvalidateType,
      automationId,
    ).catch((error) => {
      logger.error(
        {
          instaAccountId: existingAutomation.instaAccountId,
          targetId: newTargetId,
          automationId,
        },
        "Failed to invalidate NEW automation cache after update",
        error instanceof Error ? error : new Error(String(error)),
      );
    });
  }

  return {
    id: updatedAutomation.id,
    triggerType: updatedAutomation.triggerType,
    automationName: updatedAutomation.automationName,
    post: updatedAutomation.post,
    story: updatedAutomation.story,
    triggers: updatedAutomation.triggers,
    matchType: updatedAutomation.matchType,
    actionType: updatedAutomation.actionType,
    replyMessage: updatedAutomation.replyMessage,
    replyImage: updatedAutomation.replyImage,
    commentReplyWhenDm: updatedAutomation.commentReplyWhenDm,
    askToFollowEnabled: updatedAutomation.askToFollowEnabled,
    askToFollowMessage: updatedAutomation.askToFollowMessage,
    askToFollowLink: updatedAutomation.askToFollowLink,
    openingMessageEnabled: updatedAutomation.openingMessageEnabled,
    openingMessage: updatedAutomation.openingMessage,
    openingButtonText: updatedAutomation.openingButtonText,
    dmLinks: updatedAutomation.dmLinks || [],
    status: updatedAutomation.status,
    updatedAt: updatedAutomation.updatedAt,
  };
}

// Stops an automation (marks as STOPPED)
export async function stopAutomation(userId: string, instaAccountId: string, automationId: string) {
  const existingAutomation = await findAutomationByIdAndWorkspaceForUpdate(
    automationId,
    userId,
    instaAccountId,
  );

  if (!existingAutomation) {
    throw new Error("Automation not found or access denied");
  }

  await stopAutomationRecord(automationId);

  const invalidateType = getInvalidateType(
    existingAutomation.triggerType as TriggerType,
  );
  const targetId =
    existingAutomation.post?.id ?? existingAutomation.story?.id ?? "account";
  await invalidateAutomationCache(
    existingAutomation.instaAccountId,
    targetId,
    invalidateType,
    automationId,
  ).catch((error) => {
    logger.error(
      {
        instaAccountId: existingAutomation.instaAccountId,
        targetId,
        automationId,
      },
      "Failed to invalidate automation cache after stop",
      error instanceof Error ? error : new Error(String(error)),
    );
  });

  return { message: "Automation stopped successfully" };
}
