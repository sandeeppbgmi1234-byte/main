export type Contact = {
  type: "contact";
  id: string;
  avatarUrl: string;
  username: string;
  kind: "Post" | "Reel" | "Story" | "Forms";
  email: string | null;
  lastInteractedAt: string;
  formId?: string;
};

export interface ContactsListResponse {
  contacts: Contact[];
  nextCursor?: string;
}

export interface ContactsListParams {
  limit?: number;
  page?: number;
  cursor?: string;
  q?: string;
}
