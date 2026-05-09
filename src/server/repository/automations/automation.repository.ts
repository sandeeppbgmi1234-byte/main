/**
 * Automation Repository
 * Data access layer for Automation model operations
 */

import { prisma } from "@/server/db";
import { executeWithErrorHandling } from "../repository-utils";
import type { CreateAutomationInput } from "@dm-broo/common-types";
import { invalidateAutomations } from "@/server/redis";
import { logger } from "@/server/utils/pino";

import {
  Prisma,
  TriggerType,
  AutomationStatus,
  MatchType,
  ActionType,
  MediaType,
} from "@prisma/client";

import {
  CreateAutomationData,
  UpdateAutomationData,
  AutomationFilters,
} from "@/api/services/automations/types";

/**
 * Payload interface for post media metadata
 */
interface PostMediaPayload {
  postMediaType?: MediaType | null;
  postThumbnailUrl?: string | null;
}

/**
 * Payload interface for story media metadata
 */
interface StoryMediaPayload {
  thumbnailUrl?: string | null;
}

/**
 * Creates a new automation
 */
export async function createAutomation(
  userId: string,
  instaAccountId: string,
  data: CreateAutomationInput,
  triggersSignature: string,
) {
  const triggerType = data.triggerType ?? "COMMENT_ON_POST";
  const targetId =
    triggerType === "RESPOND_TO_ALL_DMS"
      ? "account"
      : triggerType === "STORY_REPLY"
        ? data.story?.id
        : data.postId;
  const targetType =
    triggerType === "RESPOND_TO_ALL_DMS"
      ? "account"
      : triggerType === "STORY_REPLY"
        ? "story"
        : "post";

  const result = await executeWithErrorHandling(
    () =>
      prisma.automation.create({
        data: {
          userId,
          instaAccountId,
          automationName: data.automationName,
          triggerType,
          targetId,
          targetType,
          // Embedded post target (only for COMMENT_ON_POST)
          ...(triggerType === "COMMENT_ON_POST" && data.postId
            ? {
                post: {
                  id: data.postId,
                  caption: data.postCaption ?? null,
                  mediaUrl: data.postMediaUrl ?? null,
                  mediaType: (data as PostMediaPayload).postMediaType ?? null,
                  thumbnailUrl:
                    (data as PostMediaPayload).postThumbnailUrl ?? null,
                  permalink: data.postPermalink ?? null,
                  timestamp: data.postTimestamp ?? null,
                },
              }
            : {}),
          // Embedded story target (only for STORY_REPLY)
          ...(triggerType === "STORY_REPLY" && data.story
            ? {
                story: {
                  id: data.story.id,
                  mediaUrl: data.story.mediaUrl,
                  mediaType: data.story.mediaType,
                  thumbnailUrl:
                    (data.story as StoryMediaPayload).thumbnailUrl ?? null,
                  caption: data.story.caption ?? null,
                  permalink: data.story.permalink,
                  timestamp: data.story.timestamp,
                },
              }
            : {}),
          triggers: data.triggers,
          triggersSignature,
          matchType: data.matchType,

          actionType: data.actionType,
          replyMessage: data.replyMessage,
          replyImage: data.replyImage,
          useVariables: data.useVariables,
          status: "ACTIVE",
          commentReplyWhenDm: data.commentReplyWhenDm,
          askToFollowEnabled: data.askToFollowEnabled ?? false,
          askToFollowMessage: data.askToFollowMessage ?? null,
          askToFollowLink: data.askToFollowLink ?? null,
          openingMessageEnabled: data.openingMessageEnabled ?? true,
          openingMessage: data.openingMessage ?? null,
          openingButtonText: data.openingButtonText ?? null,
          dmLinks: data.dmLinks ?? [],
        },
      }),
    {
      operation: "createAutomation",
      model: "Automation",
      retries: 1,
    },
  );

  if (result) {
    await invalidateAutomationsForAccount(instaAccountId, "create");
  }
  return result;
}

/**
 * Finds an automation by ID
 */
export async function findAutomationById(automationId: string) {
  return executeWithErrorHandling(
    () =>
      prisma.automation.findUnique({
        where: { id: automationId },
      }),
    {
      operation: "findAutomationById",
      model: "Automation",
      fallback: null, // Returns null if not found or on error
      retries: 1,
    },
  );
}

/**
 * Finds an automation by ID with executions
 */
export async function findAutomationByIdWithExecutions(automationId: string) {
  return executeWithErrorHandling(
    () =>
      prisma.automation.findUnique({
        where: { id: automationId },
        include: {
          executions: {
            orderBy: {
              executedAt: "desc",
            },
            take: 10,
          },
          _count: {
            select: {
              executions: true,
            },
          },
        },
      }),
    {
      operation: "findAutomationByIdWithExecutions",
      model: "Automation",
      fallback: null, // Returns null if not found or on error
      retries: 1,
    },
  );
}

/**
 * Finds an automation by ID and userId (authorized query)
 * Returns null if automation doesn't exist or user doesn't own it
 * This prevents information disclosure by checking ownership in the query
 */
export async function findAutomationByIdAndWorkspace(
  automationId: string,
  userId: string,
  instaAccountId: string,
) {
  return executeWithErrorHandling(
    () =>
      prisma.automation.findFirst({
        where: {
          id: automationId,
          userId: userId,
          instaAccountId: instaAccountId,
        },
        include: {
          executions: {
            orderBy: {
              executedAt: "desc",
            },
            take: 10,
          },
          _count: {
            select: {
              executions: true,
            },
          },
        },
      }),
    {
      operation: "findAutomationByIdAndUserId",
      model: "Automation",
      fallback: null, // Returns null if not found or on error
      retries: 1,
    },
  );
}

/**
 * Finds an automation by ID and userId (for update/stop operations)
 * Returns null if automation doesn't exist or user doesn't own it
 */
export async function findAutomationByIdAndWorkspaceForUpdate(
  automationId: string,
  userId: string,
  instaAccountId: string,
) {
  return executeWithErrorHandling(
    () =>
      prisma.automation.findFirst({
        where: {
          id: automationId,
          userId: userId,
          instaAccountId: instaAccountId,
        },
      }),
    {
      operation: "findAutomationByIdAndUserIdForUpdate",
      model: "Automation",
      fallback: null, // Returns null if not found or on error
      retries: 1,
    },
  );
}

/**
 * Finds automations filtered by workspace
 */
export async function findUserAutomations(filters: AutomationFilters) {
  return executeWithErrorHandling(
    () => {
      const where: Prisma.AutomationWhereInput = {
        instaAccountId: filters.instaAccountId,
      };

      if (filters.status) {
        if (Array.isArray(filters.status)) {
          where.status = { in: filters.status };
        } else {
          where.status = filters.status;
        }
      }

      return prisma.automation.findMany({
        where,
        include: {
          _count: {
            select: {
              executions: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        skip: filters.skip,
        take: filters.take,
      });
    },
    {
      operation: "findUserAutomations",
      model: "Automation",
      fallback: [],
      retries: 1,
    },
  );
}

/**
 * Counts automations for a workspace (for pagination)
 */
export async function countAutomations(
  filters: AutomationFilters,
): Promise<number> {
  return executeWithErrorHandling(
    () => {
      const where: Prisma.AutomationWhereInput = {
        instaAccountId: filters.instaAccountId,
      };

      if (filters.status) {
        if (Array.isArray(filters.status)) {
          where.status = { in: filters.status };
        } else {
          where.status = filters.status;
        }
      }

      return prisma.automation.count({ where });
    },
    {
      operation: "countAutomations",
      model: "Automation",
      fallback: 0,
      retries: 1,
    },
  );
}

export async function findActiveAutomationsByPost(
  instaAccountId: string,
  postId: string,
) {
  return executeWithErrorHandling(
    () =>
      prisma.automation.findMany({
        where: {
          instaAccountId,
          post: { is: { id: postId } },
          status: "ACTIVE",
        },
        orderBy: {
          createdAt: "desc",
        },
      }),
    {
      operation: "findActiveAutomationsByPost",
      model: "Automation",
      fallback: [],
      retries: 1,
    },
  );
}

/**
 * Finds active automations for a specific story
 */
export async function findActiveAutomationsByStory(
  instaAccountId: string,
  storyId: string,
) {
  return executeWithErrorHandling(
    () =>
      prisma.automation.findMany({
        where: {
          instaAccountId,
          story: { is: { id: storyId } },
          status: "ACTIVE",
        },
        orderBy: {
          createdAt: "desc",
        },
      }),
    {
      operation: "findActiveAutomationsByStory",
      model: "Automation",
      fallback: [],
      retries: 1,
    },
  );
}

/**
 * Finds automations for a specific post/story that overlap with given keywords
 */
export async function findAutomationsByTargetAndKeywords(
  instaAccountId: string,
  targetId: string,
  type: "post" | "story" | "account",
  keywords: string[],
) {
  return executeWithErrorHandling(
    () =>
      prisma.automation.findMany({
        where: {
          instaAccountId,
          status: { in: ["ACTIVE", "STOPPED"] },
          targetId,
          targetType: type,
          // Conflict logic:
          // 1. Catch-all (empty triggers) only conflicts with another catch-all
          // 2. Keyword automation only conflicts with another automation using the same keywords
          ...(keywords.length === 0
            ? { triggers: { equals: [] } }
            : { triggers: { hasSome: keywords } }),
        },
        select: {
          id: true,
          automationName: true,
          triggers: true,
        },
      }),
    {
      operation: "findAutomationsByTargetAndKeywords",
      model: "Automation",
      fallback: [],
      retries: 1,
    },
  );
}

/**
 * Updates an automation
 */
export async function updateAutomation(
  automationId: string,
  data: UpdateAutomationData,
) {
  const result = await executeWithErrorHandling(
    () =>
      prisma.automation.update({
        where: { id: automationId },
        data,
      }),
    {
      operation: "updateAutomation",
      model: "Automation",
      retries: 1,
    },
  );

  if (result) {
    await invalidateAutomationsForAccount(result.instaAccountId, "update");
  }
  return result;
}

/**
 * Updates automation trigger stats
 * Fails silently to prevent blocking automation execution
 */
export async function updateAutomationStats(automationId: string) {
  return executeWithErrorHandling(
    () =>
      prisma.automation.update({
        where: { id: automationId },
        data: {
          timesTriggered: {
            increment: 1,
          },
          lastTriggeredAt: new Date(),
        },
      }),
    {
      operation: "updateAutomationStats",
      model: "Automation",
      fallback: null, // Stats update failure shouldn't block execution
      retries: 1,
    },
  );
}

/**
 * Stops an automation (marks as STOPPED)
 */
export async function stopAutomation(automationId: string) {
  const result = await executeWithErrorHandling(
    async () => {
      return prisma.automation.update({
        where: { id: automationId },
        data: {
          status: "STOPPED",
        },
      });
    },
    {
      operation: "stopAutomation",
      model: "Automation",
      retries: 1,
    },
  );

  if (result) {
    await invalidateAutomationsForAccount(result.instaAccountId, "update");
  }
  return result;
}

/**
 * Best-effort invalidation of automations for an Instagram account.
 * Used after mutations to clear cache.
 */
async function invalidateAutomationsForAccount(
  instaAccountId: string,
  action: "create" | "update" | "stop",
) {
  try {
    const account = await prisma.instaAccount.findUnique({
      where: { id: instaAccountId },
      select: { webhookUserId: true, instagramUserId: true },
    });

    const identifier = account?.webhookUserId || account?.instagramUserId;
    if (identifier) {
      await invalidateAutomations(identifier).catch((err) => {
        logger.error(
          { err, identifier, action },
          `[Repository:Automation] Post-${action} cache invalidation failed`,
        );
      });
    } else {
      logger.warn(
        { instaAccountId, action, account },
        `[Repository:Automation] Skipping post-${action} cache invalidation: No usable identifiers found`,
      );
    }
  } catch (err) {
    logger.error(
      { err, instaAccountId, action },
      `[Repository:Automation] Post-${action} account lookup for cache invalidation failed`,
    );
  }
}
