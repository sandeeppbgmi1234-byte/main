"use client";

import React from "react";
import type { FormField } from "@dm-broo/common-types";
import type { FormSubmission } from "@/api/services/forms/form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getDisplayName, getInitials, formatDate } from "./submission-utils";
import { SubmissionAnswerValue } from "./SubmissionAnswerValue";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface SubmissionDetailDialogProps {
  submission: FormSubmission | null;
  fields: FormField[];
  onClose: () => void;
}

/**
 * Detail dialog for an individual form submission.
 * Includes user profile, verification status, and all form responses.
 */
export const SubmissionDetailDialog = ({
  submission,
  fields,
  onClose,
}: SubmissionDetailDialogProps) => {
  if (!submission) return null;

  const name = getDisplayName(fields, submission);
  const initials = getInitials(name);
  const formattedDate = formatDate(submission.submittedAt);

  return (
    <Dialog open={!!submission} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="sm:max-w-full p-0 overflow-hidden rounded-lg"
      >
        <DialogHeader className="px-8 pt-8 pb-4">
          <div className="flex justify-between items-center">
            {" "}
            <DialogTitle className="text-lg font-semibold text-[#212121] tracking-tight text-left">
              Submission Details
            </DialogTitle>
            <Button
              variant="ghost"
              className="w-8 h-8 border-gray-200"
              onClick={onClose}
              aria-label="Close submission details"
            >
              <X className="text-gray-500" size={20} aria-hidden="true" />
            </Button>
          </div>
          <Separator />
        </DialogHeader>

        <div className="w-xl px-8 pb-8 space-y-6">
          {/* Profile Card */}
          {/* <div className="flex items-center gap-4 py-2">
            <div className="w-20 h-20 rounded-full bg-[#E9E4FF] flex items-center justify-center text-[#6A06E4] text-3xl font-semibold border-2 border-white shrink-0">
              {initials}
            </div>
            <div className="space-y-1.5 min-w-0">
              <h2 className="capitalize text-xl font-semibold text-[#212121] truncate">
                {name.length > 0 ? name : "Unknown User"}
              </h2>
              <div className="flex items-center gap-2 text-slate-400 text-sm font-medium">
                <Mail size={14} className="shrink-0" />
                <span className="text-slate-400 font-normal text-xs">
                  {formattedDate}
                </span>
              </div>
            </div>
          </div> */}

          {/* Form Responses Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-[#071329] flex items-center gap-2">
              Form Responses
            </h3>

            <div className="max-h-[320px] overflow-y-auto space-y-3 pr-2 custom-scrollbar">
              {fields.map((field) => {
                const answer = submission.answers[field.id] ?? "—";

                return (
                  <div
                    key={field.id}
                    className="bg-[#F9F9F9] p-5 rounded-2xl border border-slate-100/50 space-y-1.5 transition-all hover:bg-slate-100/50"
                  >
                    <p className="text-[12px] font-medium text-[#6D6D6D] uppercase tracking-widest block">
                      {field.label}
                    </p>
                    {/* Smart renderer: image preview, file download, or plain text */}
                    <SubmissionAnswerValue value={answer} type={field.type} />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Timestamp Footer */}
          <div className="flex pt-5 border-t border-slate-100 items-center gap-2 text-slate-400 text-sm font-medium">
            <span className="capitalize ">Submitted At:</span>
            <span className="text-slate-900 font-medium">{formattedDate}</span>
          </div>
        </div>
      </DialogContent>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #cbd5e1;
        }
      `}</style>
    </Dialog>
  );
};
