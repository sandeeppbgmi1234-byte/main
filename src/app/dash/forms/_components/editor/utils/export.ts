import { FormSubmission } from "@/api/services/forms/form";
import type { FormField } from "@dm-broo/common-types";

// Characters that trigger spreadsheet formula execution
const FORMULA_LEADING_CHARS = ["=", "+", "-", "@"];

/**
 * Escapes values for CSV safety to handle commas, quotes, and formula injection
 */
const escapeCsvValue = (val: any) => {
  let str = String(val ?? "");
  if (FORMULA_LEADING_CHARS.some((char) => str.startsWith(char))) {
    str = "'" + str;
  }
  return `"${str.replace(/"/g, '""')}"`;
};

/**
 * Transforms form submission data into a CSV string and triggers a browser download
 * Handles dynamic field mapping across all historical fields snapshots
 */
export const downloadSubmissionsCSV = (
  submissions: FormSubmission[],
  fields: FormField[],
  slug: string,
) => {
  if (!submissions.length) return;

  // 1. Collect all unique fields across live schema and all submission snapshots
  // Using Map preserves insertion order and deduplicates by field id
  const uniqueFieldsMap = new Map<string, FormField>();

  // Add live fields first (so current fields appear first/in order)
  fields.forEach((f) => uniqueFieldsMap.set(f.id, f));

  // Add any historical fields from submission snapshots
  submissions.forEach((sub) => {
    if (sub.fieldsSnapshot && Array.isArray(sub.fieldsSnapshot)) {
      sub.fieldsSnapshot.forEach((f) => {
        if (!uniqueFieldsMap.has(f.id)) {
          uniqueFieldsMap.set(f.id, f);
        }
      });
    }
  });

  const allUniqueFields = Array.from(uniqueFieldsMap.values());

  // 2. Prepare Headers (Submission metadata + Dynamic Field Labels)
  const headers = [
    "Submission ID",
    "Date",
    ...allUniqueFields.map((f) => f.label || f.type),
  ];
  const fieldIds = allUniqueFields.map((f) => f.id);

  // 3. Prepare Data Rows
  const rows = submissions.map((sub) => {
    const values = [
      sub.id,
      new Date(sub.submittedAt).toLocaleString(),
      ...fieldIds.map((fid) => {
        const ans = sub.answers[fid];
        // Handle multi-select values by joining with a semicolon
        return Array.isArray(ans) ? ans.join("; ") : ans;
      }),
    ];
    return values.map(escapeCsvValue).join(",");
  });

  // 4. Construct CSV and trigger download
  const csvContent = [headers.join(","), ...rows].join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `submissions-${slug}.csv`);

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Clean up
  URL.revokeObjectURL(url);
};
