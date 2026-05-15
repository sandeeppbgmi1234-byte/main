/**
 * Configuration for dashboard tables (Automations, Forms, etc.)
 */
export const TABLE_CONFIGS = {
  automations: {
    title: "Automations",
    gridClass: "grid-cols-[1fr_1fr_1fr_1fr_1fr_auto]",
    columns: [
      { id: "title", label: "Automation", type: "main" },
      {
        id: "followers",
        label: "New Follower",
        type: "info",
        sortable: true,
      },
      { id: "status", label: "Status", type: "status" },
      { id: "count", label: "Runs", type: "info", sortable: true },
      { id: "date", label: "Last Published", type: "date", sortable: true },
      { id: "actions", label: "", type: "actions" },
    ],
  },
  forms: {
    title: "Forms",
    gridClass: "grid-cols-[2fr_1fr_1fr_1fr__1fr_auto]",
    columns: [
      { id: "title", label: "Forms", type: "main" },
      { id: "count", label: "Submissions", type: "info", sortable: true },
      { id: "status", label: "Status", type: "status" },
      { id: "date", label: "Last Published", type: "date", sortable: true },
      { id: "actions", label: "", type: "actions" },
    ],
  },
  contacts: {
    title: "Contacts",
    gridClass: "grid-cols-[1fr_1fr_1fr_1fr]",
    columns: [
      { id: "username", label: "Username", type: "main" },
      { id: "type", label: "Type", type: "status", sortable: true },
      { id: "email", label: "Email ID", type: "info" },
      { id: "date", label: "Last Interacted", type: "date", sortable: true },
    ],
  },
} as const;

export type TableVariant = keyof typeof TABLE_CONFIGS;
