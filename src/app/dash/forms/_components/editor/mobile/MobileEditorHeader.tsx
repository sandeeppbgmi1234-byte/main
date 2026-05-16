import React from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ActiveWorkspaceAvatar } from "@/components/ActiveWorkspaceAvatar";
import { RefreshCw, Link2, Eye, Send, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/server/utils";
import { useFormEditor } from "../../../../../../providers/FormEditorProvider";
import { useFormActions } from "../../../_hooks/useFormActions";

interface MobileEditorHeaderProps {
  formId?: string;
  activeTab: "editor" | "submissions";
}

/**
 * Mobile-specific header for the form editor.
 * Refactored to use shared context and actions.
 */
export const MobileEditorHeader = ({ activeTab }: MobileEditorHeaderProps) => {
  const { currentStatus, isLoading, isSaving, isMediaUploading, form } =
    useFormEditor();
  const {
    handlePublish,
    handleSave,
    handleUpdate,
    handleUnpublish,
    handleCopyLink,
    handlePreview,
  } = useFormActions();

  const isPublished = currentStatus === "PUBLISHED";

  return (
    <div className="flex flex-col bg-[#F3F4F6] gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <SidebarTrigger className="text-[#0F172A] scale-125" />
          <span className="text-3xl font-semibold text-[#6A06E4] tracking-tight">
            Dmbroo
          </span>
        </div>
        <ActiveWorkspaceAvatar size={50} />
      </div>

      {activeTab === "editor" && (
        <div className="flex items-center gap-3 h-12">
          <div className="h-full flex items-center bg-white rounded-lg px-4 flex-1 min-w-0 border border-slate-50">
            <span className="text-xs font-medium text-[#9E9E9E]">Forms</span>
            <span className="text-xs font-medium text-[#071329] mx-1.5">/</span>
            <span className="text-xs font-bold text-[#0F172A] truncate">
              Editor
            </span>
          </div>

          <div className="h-full flex items-center gap-2 shrink-0">
            <Button
              onClick={handleUnpublish}
              disabled={isLoading || !isPublished}
              size="icon"
              className="h-full w-[52px] rounded-md bg-red-500 hover:bg-red-600 text-white shrink-0 border-none transition-all active:scale-95 disabled:opacity-40"
            >
              <Square size={22} fill="currentColor" />
            </Button>

            <Button
              size="icon"
              disabled={!form?.slug || !isPublished}
              className="h-full w-[52px] rounded-md bg-[#0F172A] hover:bg-[#1E293B] text-white shrink-0 border-none transition-all active:scale-95 disabled:opacity-40"
              onClick={handleCopyLink}
            >
              <Link2 size={22} />
            </Button>

            <Button
              size="icon"
              disabled={!form?.slug}
              className="h-full w-[52px] rounded-md bg-[#0F172A] hover:bg-[#1E293B] text-white shrink-0 border-none transition-all active:scale-95 disabled:opacity-40"
              onClick={handlePreview}
            >
              <Eye size={22} />
            </Button>

            <Button
              onClick={isPublished ? handleUpdate : handlePublish}
              disabled={isLoading || isSaving || isMediaUploading}
              size="icon"
              className="h-full w-[52px] rounded-md bg-[#16A34A] hover:bg-[#15803D] text-white shrink-0 border-none transition-all active:scale-95 disabled:opacity-50"
            >
              {isSaving || isMediaUploading ? (
                <RefreshCw size={22} className="animate-spin" />
              ) : (
                <Send size={22} className={cn(!isPublished && "ml-0.5")} />
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
