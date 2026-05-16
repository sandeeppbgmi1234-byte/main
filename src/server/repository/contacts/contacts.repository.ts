/**
 * Contacts Repository
 * Data access layer for derived Contact information from AutomationExecutions and FormSubmissions
 */

import { prisma } from "@/server/db";
import { executeWithErrorHandling } from "../repository-utils";

// Fetches unique contacts derived from executions and form submissions in a specific workspace
export async function getUniqueContactsForWorkspace(
  instaAccountId: string,
  limit: number = 20,
  cursor?: string,
  query?: string,
) {
  return executeWithErrorHandling(
    async () => {
      const normalizedQuery = query?.trim();

      // Fetch unique contacts from automation executions
      const executions = await prisma.automationExecution.findMany({
        where: {
          automation: { instaAccountId },
          ...(normalizedQuery
            ? {
                senderUsername: {
                  contains: normalizedQuery,
                  mode: "insensitive",
                },
              }
            : {}),
        },
        distinct: ["senderId"],
        include: {
          automation: {
            select: {
              triggerType: true,
              post: true,
            },
          },
        },
        orderBy: {
          executedAt: "desc",
        }, take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        skip: cursor ? 1 : 0,
      });

      // Fetch form submissions for the workspace
      const formSubmissions = await prisma.formSubmission.findMany({
        where: {
          form: { instaAccountId },
        },
        include: {
          form: {
            select: { id: true },
          },
        },
        orderBy: {
          submittedAt: "desc",
        }, take: limit + 1,
      });

      // Map the executions to the normalized contact format
      const executionContacts: any[] = executions.slice(0, limit).map((execution) => {
        let kind: "Post" | "Reel" | "Story" | "Forms" = "Post";
        if (execution.automation.triggerType === "STORY_REPLY") {
          kind = "Story";
        } else if (execution.automation.post?.mediaType === "VIDEO") {
          kind = "Reel";
        }

        return {
          type: "contact",
          id: execution.senderId,
          username: execution.senderUsername,
          avatarUrl: "",
          kind: kind,
          email: null,
          lastInteractedAt: execution.executedAt,
          lastExecutionId: execution.id,
        };
      });

      // Map form submissions to normalized contact format
      const formContacts: any[] = formSubmissions.slice(0, limit).map((sub) => {
        const fields = Array.isArray(sub.fieldsSnapshot) ? sub.fieldsSnapshot : [];
        const answers: any = sub.answers || {};

        // Find display name field matching common name identifiers
        const nameField = fields.find((f: any) =>
          /name|user|full|first|sender/i.test(f?.label || ""),
        );
        const displayName =
          nameField && answers[nameField.id]
            ? String(answers[nameField.id])
            : "Unknown User";

        return {
          type: "contact",
          id: sub.id,
          username: displayName,
          avatarUrl: "",
          kind: "Forms",
          email: null,
          lastInteractedAt: sub.submittedAt,
          lastExecutionId: sub.id,
          formId: sub.formId,
        };
      });

      // Combine both sources, sort by date descending, and slice top limit
      const allContacts = [...executionContacts, ...formContacts];
      allContacts.sort(
        (a, b) => b.lastInteractedAt.getTime() - a.lastInteractedAt.getTime(),
      );

      const contacts = allContacts.slice(0, limit);
      const nextCursor =
        allContacts.length > limit ? allContacts[limit].lastExecutionId : undefined;

      return {
        contacts,
        nextCursor,
      };
    },
    {
      operation: "getUniqueContactsForUser",
      model: "AutomationExecution",
      fallback: { contacts: [], nextCursor: undefined },
      retries: 1,
    },
  );
}
