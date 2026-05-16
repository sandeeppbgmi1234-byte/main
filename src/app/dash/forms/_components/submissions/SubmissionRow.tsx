"use client";

import React from "react";
import { Layers } from "lucide-react";
import type { FormField } from "@dm-broo/common-types";
import type { FormSubmission } from "@/api/services/forms/form";
import { getDisplayName, formatDate } from "./submission-utils";

interface SubmissionRowProps {
  submission: FormSubmission;
  fields: FormField[];
  onClick: () => void;
}

/**
 * Individual row in the submissions list.
 * Handles display logic for user identity and timestamp.
 */
export const SubmissionRow = ({
  submission,
  fields,
  onClick,
}: SubmissionRowProps) => {
  const activeFields = (
    submission.fieldsSnapshot?.length ? submission.fieldsSnapshot : fields
  ) as FormField[];
  const name = getDisplayName(activeFields, submission);
  const formattedDate = formatDate(submission.submittedAt);

  return (
    <div
      onClick={onClick}
      className="grid grid-cols-[1fr_auto] items-center px-8 py-5 hover:bg-slate-100/30 transition-all cursor-pointer group"
    >
      {/* User Identity Column */}
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-lg bg-[#F5F3FF] flex items-center justify-center text-[#6A06E4] group-hover:bg-[#6A06E4] group-hover:text-white transition-colors duration-300 border border-[#E9E4FF]">
          <Layers size={18} />
        </div>
        <span className="capitalize text-sm font-medium text-[#212121] group-hover:text-[#6A06E4] transition-colors">
          {name.length > 0 ? name : "Unknown User"}
        </span>
      </div>

      {/* Timestamp Column */}
      <div className="text-sm text-[#212121] font-medium whitespace-nowrap">
        {formattedDate}
      </div>
    </div>
  );
};
