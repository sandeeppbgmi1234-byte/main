import type { FormField } from "@dm-broo/common-types";

// Lightweight item used in the dashboard forms list
export type FormListItem = {
  type: "form";
  id: string;
  name: string;
  title: string;
  description: string;
  coverImage?: string | null;
  status: "DRAFT" | "PUBLISHED";
  slug: string;
  submissionCount: number;
  submitButtonLabel: string;
  createdAt: string;
  updatedAt: string;
};

// Full form used inside the editor (includes field definitions)
export type FormDetail = FormListItem & {
  fields: FormField[];
};

// Minimal form exposed to public visitors (no internal metadata)
export type FormPublic = {
  id: string;
  title: string;
  description: string;
  coverImage?: string | null;
  fields: FormField[];
  submitButtonLabel: string;
};

// One entry in the submissions table
export type FormSubmission = {
  id: string;
  answers: Record<string, string | string[]>;
  submittedAt: string;
  fieldsSnapshot?: FormField[];
};

// Returned on successful form save
export type FormSaveResult = {
  id: string;
  slug: string;
  status: string;
  createdAt: string;
};
