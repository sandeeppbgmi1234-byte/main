"use client";

import React, { useState, useMemo } from "react";
import type { FormField } from "@dm-broo/common-types";
import type { FormSubmission } from "@/api/services/forms/form";
import { ArrowDown, ArrowUp, Layers } from "lucide-react";
import { SubmissionRow } from "./submissions/SubmissionRow";
import { SubmissionDetailDialog } from "./submissions/SubmissionDetailDialog";

/**
 * SubmissionsList orchestrates the display of form entries.
 * Decomposes into smaller components for rows and detail dialogs.
 */
interface SubmissionsListProps {
  fields: FormField[];
  submissions: FormSubmission[];
}

export const SubmissionsList = ({
  fields,
  submissions,
}: SubmissionsListProps) => {
  const [selectedSubmission, setSelectedSubmission] =
    useState<FormSubmission | null>(null);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const sortedSubmissions = useMemo(() => {
    return [...submissions].sort((a, b) => {
      const dateA = new Date(a.submittedAt).getTime();
      const dateB = new Date(b.submittedAt).getTime();
      if (sortOrder === "asc") return dateA - dateB;
      return dateB - dateA;
    });
  }, [submissions, sortOrder]);

  const toggleSort = () => {
    setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
  };

  if (submissions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-slate-400 gap-4">
        <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center border border-dashed border-slate-200">
          <Layers size={24} className="text-slate-300" />
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold text-slate-600">
            No submissions yet
          </p>
          <p className="text-xs">
            Once users fill out your form, they will appear here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full rounded-xl overflow-hidden">
      {/* List Header */}
      <div className="grid grid-cols-[1fr_auto] items-center px-8 py-4 bg-[#f1f1f1] m-4 rounded-md">
        <span className="text-sm font-semibold text-[#212121] text-left">
          Title
        </span>
        <div
          aria-sort={sortOrder === "desc" ? "descending" : "ascending"}
          className="flex items-center"
        >
          <button
            type="button"
            onClick={toggleSort}
            aria-label={`Sort submissions, ${
              sortOrder === "desc" ? "newest first" : "oldest first"
            }`}
            className="flex items-center gap-2 text-sm font-semibold text-[#212121] hover:text-[#6A06E4] transition-colors group"
          >
            <span>Submitted</span>
            <div className="bg-slate-900 text-white rounded-md p-1 group-hover:bg-[#6A06E4] transition-colors">
              {sortOrder === "desc" ? (
                <ArrowDown size={14} />
              ) : (
                <ArrowUp size={14} />
              )}
            </div>
          </button>
        </div>
      </div>

      <div className="divide-y divide-slate-50">
        {sortedSubmissions.map((submission) => (
          <SubmissionRow
            key={submission.id}
            submission={submission}
            fields={fields}
            onClick={() => setSelectedSubmission(submission)}
          />
        ))}
      </div>

      {/* Submission Detail Dialog */}
      <SubmissionDetailDialog
        submission={selectedSubmission}
        fields={fields}
        onClose={() => setSelectedSubmission(null)}
      />
    </div>
  );
};
