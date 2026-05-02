import { prisma } from "@/server/db";
import { executeWithErrorHandling } from "../repository-utils";
import { ApiRouteError } from "@/server/middleware/errors/classes";
import type { CreateFormInput, FormStatus } from "@dm-broo/common-types";
import type { Form, FormSubmission } from "@prisma/client";

// Generates a short 8-char alphanumeric slug from a UUID
function generateSlug(): string {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 8);
}

// Creates a form scoped to a workspace. Retries up to 5 times on slug collision (P2002)
// Enforces maxForms limit atomically within a transaction
export async function createForm(
  userId: string,
  instaAccountId: string,
  data: CreateFormInput,
  maxForms: number = -1,
): Promise<Form> {
  return await prisma.$transaction(async (tx) => {
    // 1. ATOMIC LIMIT CHECK
    if (maxForms !== -1) {
      // Ensure quota record exists (idempotent migration for existing accounts)
      const quota = await tx.formQuota.findUnique({
        where: { instaAccountId },
      });

      if (!quota) {
        const count = await tx.form.count({ where: { instaAccountId } });
        await tx.formQuota.create({
          data: { instaAccountId, count },
        });
      }

      // Reserve one slot atomically
      const result = await tx.formQuota.updateMany({
        where: {
          instaAccountId,
          count: { lt: maxForms },
        },
        data: {
          count: { increment: 1 },
        },
      });

      if (result.count === 0) {
        throw new ApiRouteError(
          `Free plan allows up to ${maxForms} forms. Upgrade to create more.`,
          "FORM_LIMIT_REACHED",
          403,
        );
      }
    }

    let attempts = 0;
    while (attempts < 5) {
      const slug = generateSlug();

      try {
        return await tx.form.create({
          data: {
            userId,
            instaAccountId,
            name: data.name || data.title,
            title: data.title,
            description: data.description ?? "",
            coverImage: data.coverImage ?? null,
            fields: (data.fields ?? []) as any,
            slug,
            status: data.status ?? "DRAFT",
            submitButtonLabel: data.submitButtonLabel ?? "Submit",
          },
        });
      } catch (error: any) {
        // Retry only on unique constraint violation (slug collision)
        if (error?.code === "P2002") {
          attempts++;
          continue;
        }
        throw error;
      }
    }

    throw new Error("Failed to generate a unique slug after 5 attempts");
  });
}

// Returns total form count for a workspace — used for FREE plan cap enforcement
export async function countFormsByInstaAccountId(
  instaAccountId: string,
): Promise<number> {
  return prisma.form.count({ where: { instaAccountId } });
}

// All forms for a workspace, ordered newest first. Optionally filter by status.
export async function findFormsByInstaAccountId(
  instaAccountId: string,
  status?: FormStatus,
): Promise<Form[]> {
  return executeWithErrorHandling(
    () =>
      prisma.form.findMany({
        where: {
          instaAccountId,
          ...(status ? { status } : {}),
        },
        orderBy: { createdAt: "desc" },
      }),
    { operation: "findFormsByInstaAccountId", model: "Form", fallback: [] },
  );
}

// Single form by DB id — no ownership check (caller must verify)
export async function findFormById(formId: string): Promise<Form | null> {
  return executeWithErrorHandling(
    () => prisma.form.findUnique({ where: { id: formId } }),
    { operation: "findFormById", model: "Form", fallback: null },
  );
}

// Ownership-scoped get — returns null if form doesn't belong to the user
export async function findFormByIdAndUserId(
  formId: string,
  userId: string,
): Promise<Form | null> {
  return executeWithErrorHandling(
    () =>
      prisma.form.findFirst({
        where: { id: formId, userId },
        include: { submissions: false },
      }),
    { operation: "findFormByIdAndUserId", model: "Form", fallback: null },
  );
}

// Used by the public page and submission handler
export async function findFormBySlug(slug: string): Promise<Form | null> {
  return executeWithErrorHandling(
    () => prisma.form.findUnique({ where: { slug } }),
    { operation: "findFormBySlug", model: "Form", fallback: null },
  );
}

// Saves a submission + atomically increments submissionCount
export async function createFormSubmission(
  formId: string,
  answers: Record<string, string | string[] | null>,
  meta: { ipAddress?: string; userAgent?: string },
): Promise<FormSubmission> {
  const [submission] = await prisma.$transaction([
    prisma.formSubmission.create({
      data: {
        formId,
        answers,
        ipAddress: meta.ipAddress ?? null,
        userAgent: meta.userAgent ?? null,
      },
    }),
    prisma.form.update({
      where: { id: formId },
      data: { submissionCount: { increment: 1 } },
    }),
  ]);

  return submission;
}

// Hard deletes a form by id (submissions cascade via DB constraint)
// Decrements FormQuota count atomically
export async function deleteFormById(formId: string): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const form = await tx.form.findUnique({
      where: { id: formId },
      select: { instaAccountId: true },
    });

    if (!form) return;

    await tx.form.delete({ where: { id: formId } });

    // Decrement quota if it exists
    await tx.formQuota.updateMany({
      where: { instaAccountId: form.instaAccountId, count: { gt: 0 } },
      data: { count: { decrement: 1 } },
    });
  });
}

// All submissions for a form, newest first
export async function findSubmissionsByFormId(
  formId: string,
): Promise<FormSubmission[]> {
  return executeWithErrorHandling(
    () =>
      prisma.formSubmission.findMany({
        where: { formId },
        orderBy: { submittedAt: "desc" },
      }),
    {
      operation: "findSubmissionsByFormId",
      model: "FormSubmission",
      fallback: [],
    },
  );
}

// Updates an existing form
export async function updateForm(
  formId: string,
  data: Partial<CreateFormInput>,
): Promise<Form> {
  return executeWithErrorHandling(
    () =>
      prisma.form.update({
        where: { id: formId },
        data: {
          name: data.name,
          title: data.title,
          description: data.description,
          coverImage: data.coverImage,
          ...(data.fields !== undefined && { fields: data.fields as any }),
          status: data.status,
          submitButtonLabel: data.submitButtonLabel,
        },
      }),
    { operation: "updateForm", model: "Form" },
  );
}
