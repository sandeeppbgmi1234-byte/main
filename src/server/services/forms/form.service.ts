import { z } from "zod";
import { findUserByClerkId } from "@/server/repository/user/user.repository";
import {
  createForm as createFormRecord,
  findFormsByInstaAccountId,
  findFormByIdAndUserId,
  findFormBySlug,
  createFormSubmission,
  findSubmissionsByFormId,
  deleteFormById,
  updateForm as updateFormRecord,
} from "@/server/repository/forms";
import { prisma } from "@/server/db";
import { ApiRouteError } from "@/server/middleware/errors/classes";
import type {
  CreateFormInput,
  SubmitFormInput,
  FieldType,
  FormStatus,
} from "@dm-broo/common-types";
import type { FormFieldEntry } from "@prisma/client";

// Config-driven validators per field type — runs during submission
const FIELD_VALIDATORS: Partial<
  Record<FieldType, (value: unknown, field: FormFieldEntry) => boolean>
> = {
  email: (v) => z.string().email().safeParse(v).success,
  url: (v) => z.string().url().safeParse(v).success,
  number: (v) =>
    typeof v === "string" &&
    !isNaN(Number(v)) &&
    v.trim() !== "" &&
    v.length <= 15,
  phone: (v) =>
    typeof v === "string" &&
    (/^\+\d{11,14}$/.test(v) || /^\+\d{1,4}\|phone\|\d{7,10}$/.test(v)),
  rating: (v) =>
    typeof v === "string" &&
    Number(v) >= 1 &&
    Number(v) <= 5 &&
    Number.isInteger(Number(v)),
  dropdown: (v, f) =>
    typeof v === "string" &&
    ((f.options ?? []) as any[]).some((o: any) => o.label === v),
  checkbox: (v, f) =>
    Array.isArray(v) &&
    v.every((item) =>
      ((f.options ?? []) as any[]).some((o: any) => o.label === item),
    ),
  upload: (v) => {
    if (typeof v !== "string") return false;
    // Handle legacy plain URL strings
    if (v.startsWith("https://")) return true;
    try {
      // Handle new JSON-encoded metadata (url and name)
      const data = JSON.parse(v);
      return typeof data.url === "string" && data.url.startsWith("https://");
    } catch {
      return false;
    }
  },
};

// Creates a form scoped to a workspace
export async function createForm(
  clerkId: string,
  instaAccountId: string,
  input: CreateFormInput,
  maxForms: number = -1,
) {
  const user = await findUserByClerkId(clerkId);
  if (!user) {
    throw new ApiRouteError("User not found", "NO_USER", 404);
  }

  // Ownership + workspace check before creation
  const account = await prisma.instaAccount.findFirst({
    where: { id: instaAccountId, userId: user.id, isActive: true },
    select: { id: true },
  });

  if (!account) {
    throw new ApiRouteError(
      "Instagram account not found or access denied",
      "AUTH_ERROR",
      403,
    );
  }

  const form = await createFormRecord(user.id, instaAccountId, input, maxForms);

  return {
    id: form.id,
    slug: form.slug,
    status: form.status,
    createdAt: form.createdAt,
  };
}

// Lightweight list for the dashboard — workspace scoped
export async function getUserForms(
  instaAccountId: string,
  status?: FormStatus,
) {
  const forms = await findFormsByInstaAccountId(instaAccountId, status);

  return forms.map((f) => ({
    type: "form" as const,
    id: f.id,
    name: f.name,
    title: f.title,
    description: f.description,
    coverImage: f.coverImage,
    slug: f.slug,
    status: f.status,
    submissionCount: f.submissionCount,
    submitButtonLabel: f.submitButtonLabel,
    createdAt: f.createdAt,
    updatedAt: f.updatedAt,
  }));
}

// Full form for the editor — ownership and workspace checked
export async function getFormById(
  clerkId: string,
  instaAccountId: string,
  formId: string,
) {
  const user = await findUserByClerkId(clerkId);

  if (!user) {
    throw new ApiRouteError("User not found", "NO_USER", 404);
  }

  // Cross-check both user and workspace for isolation
  const form = await findFormByIdAndUserId(formId, user.id);

  if (!form || form.instaAccountId !== instaAccountId) {
    throw new ApiRouteError("Form not found", "NOT_FOUND", 404);
  }

  return form;
}

// Public-facing form data — strips internal fields
export async function getPublicFormBySlug(slug: string) {
  const form = await findFormBySlug(slug);

  if (!form) {
    throw new ApiRouteError("Form not found", "NOT_FOUND", 404);
  }

  if (form.status !== "PUBLISHED") {
    throw new ApiRouteError("Form is not published", "NOT_PUBLISHED", 403);
  }

  return {
    id: form.id,
    title: form.title,
    description: form.description,
    coverImage: form.coverImage,
    fields: form.fields,
    status: form.status,
    submitButtonLabel: form.submitButtonLabel,
  };
}

// Validates and persists a form submission
export async function submitForm(
  slug: string,
  input: SubmitFormInput,
  meta: { ipAddress?: string; userAgent?: string },
) {
  const form = await findFormBySlug(slug);

  if (!form) {
    throw new ApiRouteError("Form not found", "NOT_FOUND", 404);
  }

  if (form.status !== "PUBLISHED") {
    throw new ApiRouteError("Form is not published", "NOT_PUBLISHED", 403);
  }

  // Walk every field and validate the submitted answer
  for (const field of form.fields as FormFieldEntry[]) {
    const answer = input.answers[field.id];
    const isEmpty =
      answer === undefined ||
      answer === null ||
      answer === "" ||
      (Array.isArray(answer) && answer.length === 0);

    if (field.required && isEmpty) {
      throw new ApiRouteError(
        `"${field.label}" is required`,
        "INVALID_ANSWER",
        422,
      );
    }

    // Skip optional fields that weren't answered
    if (isEmpty) continue;

    const validator = FIELD_VALIDATORS[field.type as FieldType];

    if (validator && !validator(answer, field)) {
      throw new ApiRouteError(
        `Invalid value for "${field.label}"`,
        "INVALID_ANSWER",
        422,
      );
    }
  }

  const submission = await createFormSubmission(form.id, input.answers, meta);

  return {
    submissionId: submission.id,
    submittedAt: submission.submittedAt,
  };
}

// Returns all submissions for a form — owner and workspace checked
export async function getFormSubmissions(
  clerkId: string,
  instaAccountId: string,
  formId: string,
) {
  const user = await findUserByClerkId(clerkId);

  if (!user) {
    throw new ApiRouteError("User not found", "NO_USER", 404);
  }

  // Ownership + workspace check
  const form = await findFormByIdAndUserId(formId, user.id);

  if (!form || form.instaAccountId !== instaAccountId) {
    throw new ApiRouteError("Form not found", "NOT_FOUND", 404);
  }

  return findSubmissionsByFormId(formId);
}

// Deletes a form — ownership and workspace verified
export async function deleteForm(
  clerkId: string,
  instaAccountId: string,
  formId: string,
) {
  const user = await findUserByClerkId(clerkId);

  if (!user) {
    throw new ApiRouteError("User not found", "NO_USER", 404);
  }

  const form = await findFormByIdAndUserId(formId, user.id);

  if (!form || form.instaAccountId !== instaAccountId) {
    throw new ApiRouteError("Form not found", "NOT_FOUND", 404);
  }

  await deleteFormById(formId);

  return { message: "Form deleted successfully" };
}

/**
 * Updates an existing form owned by the user.
 * Verified ownership before applying the prisma update.
 */
// Updates an existing form owned by the workspace user
export async function updateForm(
  clerkId: string,
  instaAccountId: string,
  formId: string,
  input: Partial<CreateFormInput>,
) {
  const user = await findUserByClerkId(clerkId);
  if (!user) {
    throw new ApiRouteError("User not found", "NO_USER", 404);
  }

  // Ownership + workspace check
  const existingForm = await findFormByIdAndUserId(formId, user.id);
  if (!existingForm || existingForm.instaAccountId !== instaAccountId) {
    throw new ApiRouteError("Form not found", "NOT_FOUND", 404);
  }

  const updated = await updateFormRecord(formId, input);

  return {
    id: updated.id,
    slug: updated.slug,
    status: updated.status,
    updatedAt: updated.updatedAt,
  };
}

/**
 * Creates a duplicate of an existing form.
 * Everything is copied exactly, but with (Copy) appended to title and a new slug.
 */
export async function duplicateForm(
  clerkId: string,
  instaAccountId: string,
  formId: string,
  maxForms: number = -1,
) {
  const user = await findUserByClerkId(clerkId);
  if (!user) {
    throw new ApiRouteError("User not found", "NO_USER", 404);
  }

  // Cross-check both user and workspace for isolation
  const existingForm = await findFormByIdAndUserId(formId, user.id);

  if (!existingForm || existingForm.instaAccountId !== instaAccountId) {
    throw new ApiRouteError("Form not found", "NOT_FOUND", 404);
  }

  const duplicateInput: any = {
    name: `${existingForm.name ?? "Untitled Form"} (Copy)`,
    title: `${existingForm.title ?? "Untitled Form"}`,
    description: existingForm.description ?? "",
    coverImage: existingForm.coverImage ?? undefined,
    fields: existingForm.fields as any,
    status: "DRAFT",
  };

  const duplicated = await createFormRecord(
    user.id,
    instaAccountId,
    duplicateInput,
    maxForms,
  );

  return {
    id: duplicated.id,
    slug: duplicated.slug,
    status: duplicated.status,
    createdAt: duplicated.createdAt,
  };
}
