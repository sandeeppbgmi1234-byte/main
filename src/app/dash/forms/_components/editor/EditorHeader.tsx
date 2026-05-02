import React from "react";
import { Button } from "@/components/ui/button";
import { useFormEditor } from "../../../../../providers/FormEditorProvider";
import {
  Download,
  Square,
  RefreshCw,
  Link2,
  Eye,
  SendIcon,
} from "lucide-react";
import { EditableFormName } from "./EditableFormName";
import { useFormActions } from "../../_hooks/useFormActions";

type EditorHeaderProps = {
  activeTab: string;
};

/**
 * Lean form editor header.
 * Consumes data from useFormEditor and actions from useFormActions.
 */
const EditorHeader = ({ activeTab }: EditorHeaderProps) => {
  const {
    currentStatus,
    methods,
    isNameDialogOpen,
    setIsNameDialogOpen,
    isSaving,
    isMediaUploading,
    isLoading,
    form,
  } = useFormEditor();

  const {
    handlePublish,
    handleSave,
    handleUpdate,
    handleRename,
    handleExport,
    handleCopyLink,
    handlePreview,
    exportStatus,
  } = useFormActions();

  const nameWatch = methods.watch("name");
  const isFormMetadataReady = !!form?.fields;

  return (
    <header className="flex h-10 shrink-0 items-center gap-4">
      <div className="flex w-full items-center justify-between gap-4 h-full">
        {/* Breadcrumb pill */}
        <div className="bg-white justify-between rounded-lg px-4 flex items-center h-full flex-1 min-w-0 border border-slate-100">
          <p className="text-sm font-semibold flex gap-1 items-center truncate">
            <span className="opacity-50 shrink-0 capitalize">forms / </span>
            <span
              className={
                nameWatch && nameWatch !== "Untitled Form"
                  ? "text-[#1A1D1F] font-bold"
                  : "text-[#6A06E4] italic font-medium"
              }
            >
              {nameWatch || "Untitled Form"}
            </span>
          </p>
          <EditableFormName
            value={nameWatch || ""}
            onChange={handleRename}
            open={isNameDialogOpen}
            onOpenChange={setIsNameDialogOpen}
          />
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-4 shrink-0">
          {activeTab === "editor" && form?.slug && (
            <>
              <Button
                disabled={isLoading}
                onClick={handleCopyLink}
                size="icon"
                variant="secondary"
                title="Copy Link"
                className="h-10 w-10 bg-slate-900 hover:bg-slate-700 text-white rounded-lg"
              >
                <Link2 size={15} />
              </Button>
              <Button
                disabled={isLoading}
                onClick={handlePreview}
                size="icon"
                variant="secondary"
                title="Preview"
                className="h-10 w-10 bg-slate-900 hover:bg-slate-700 text-white rounded-lg"
              >
                <Eye size={15} />
              </Button>
            </>
          )}

          {activeTab === "editor" && (
            <div className="flex items-center gap-3 h-10 scale-90 sm:scale-100 origin-right">
              {/* Stop Button - Only if Live */}
              {currentStatus === "PUBLISHED" && (
                <Button
                  onClick={handleSave}
                  disabled={isLoading}
                  className="bg-red-500 hover:bg-red-600 disabled:bg-slate-300 disabled:text-slate-500 text-white gap-2 h-10 px-4 transition-all rounded-lg"
                >
                  {isSaving ? (
                    <RefreshCw size={15} className="animate-spin" />
                  ) : (
                    <Square size={15} fill="currentColor" />
                  )}
                </Button>
              )}

              {/* Status Indicator / Go Live Button */}
              {currentStatus === "PUBLISHED" ? (
                <div className="h-10 px-6 rounded-sm border border-[#4ADE80] text-[#15803D] text-[15px] font-bold flex items-center justify-center shrink-0 bg-[#CCFFD9] shadow-sm">
                  Live
                </div>
              ) : (
                <Button
                  onClick={handlePublish}
                  disabled={isLoading}
                  className="bg-[#068E19] hover:bg-[#057a16] disabled:bg-gray-200 disabled:text-gray-400 text-white gap-2 h-10 px-4 font-semibold transition-all rounded-sm shadow-sm"
                >
                  {isSaving ? "Starting..." : "Publish"}
                  {isSaving ? (
                    <RefreshCw size={13} className="animate-spin" />
                  ) : isMediaUploading ? (
                    <span className="w-2 h-2 rounded-full bg-gray-400" />
                  ) : (
                    <SendIcon />
                  )}
                </Button>
              )}

              {/* Update Button - Only if Live */}
              {currentStatus === "PUBLISHED" && (
                <Button
                  onClick={handleUpdate}
                  disabled={isLoading}
                  className="bg-[#6A06E4] hover:bg-[#5a05c4] text-white gap-2 h-10 px-4 transition-all rounded-sm shadow-md"
                >
                  Update
                </Button>
              )}
            </div>
          )}

          {activeTab === "submissions" && (
            <Button
              disabled={
                !isFormMetadataReady || isLoading || exportStatus !== "idle"
              }
              onClick={handleExport}
              className="bg-[#6A06E4] hover:bg-[#5a05c4] text-white gap-2 h-10 px-6 rounded-sm"
            >
              <Download size={15} />
              {exportStatus === "exporting"
                ? "Exporting..."
                : exportStatus === "exported"
                  ? "Exported"
                  : "Export List"}
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};

export default EditorHeader;
