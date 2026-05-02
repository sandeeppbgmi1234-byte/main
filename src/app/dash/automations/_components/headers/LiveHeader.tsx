import { AutomationListItem } from "@/api/services/automations/types";
import { Button } from "@/components/ui/button";
import { Play, RefreshCw, Square } from "lucide-react";
import EditableAutomationName from "./EditableAutomationName";

interface LiveHeaderProps {
  automation: AutomationListItem;
  onStop: () => void;
  isStopping: boolean;
  onStart: () => void;
  isStarting: boolean;
  isUpdating?: boolean;
  isMediaUploading?: boolean;
  breadcrumb?: string;
  onNameChange: (name: string) => void;
  isMobile?: boolean; // Layout adaptation
  isNameDialogOpen?: boolean; // Controlled name popup
  setIsNameDialogOpen?: (open: boolean) => void;
}

export default function LiveHeader({
  automation,
  onStop,
  isStopping,
  onStart,
  isStarting,
  isUpdating,
  isMediaUploading,
  breadcrumb = "DM For Comment",
  onNameChange,
  isMobile = false,
  isNameDialogOpen,
  setIsNameDialogOpen,
}: LiveHeaderProps) {
  const automationName = automation.automationName ?? "";
  const isActive = automation.status === "ACTIVE";

  return (
    <div className="flex w-full gap-2 items-center animate-in fade-in slide-in-from-top-2 duration-300">
      {/* Breadcrumb pill with name editor */}
      <div className="flex items-center justify-between gap-4 bg-white rounded-md px-4 h-10 flex-1 min-w-0">
        {!isMobile && (
          <p className="text-sm font-semibold truncate shrink-0">
            <span className="opacity-50">Automation / {breadcrumb} / </span>
          </p>
        )}
        <p className="text-sm font-semibold truncate flex-1 min-w-0 flex items-center">
          <span
            className={
              automationName
                ? "text-[#0F172A] font-bold truncate"
                : "text-[#6A06E4] italic font-medium truncate"
            }
          >
            {automationName || "Automation Name"}
          </span>
        </p>
        <EditableAutomationName
          value={automationName}
          onChange={onNameChange}
          open={isNameDialogOpen}
          onOpenChange={setIsNameDialogOpen}
        />
      </div>

      {/* Action buttons matching mobile square specs */}
      <div className="flex items-center gap-2 shrink-0">
        {isActive && (
          <Button
            type="submit"
            disabled={isUpdating || isMediaUploading}
            className="h-10 p-0 bg-indigo-600 hover:bg-indigo-700 transition-all text-white rounded-md flex items-center justify-center disabled:bg-indigo-400 disabled:opacity-50"
            title="Update"
            aria-label="Update Automation"
          >
            <RefreshCw
              size={18}
              className={isUpdating && !isMediaUploading ? "animate-spin" : ""}
            />
            {!isMobile && <p className="text-sm font-medium">Update</p>}
          </Button>
        )}

        {isActive ? (
          <Button
            type="button"
            onClick={onStop}
            disabled={isStopping}
            className="h-10 p-0 bg-red-500 hover:bg-red-600 transition-all text-white rounded-md flex items-center justify-center"
            title="Stop"
            aria-label="Stop Automation"
          >
            {isStopping ? (
              <RefreshCw size={18} className="animate-spin" />
            ) : (
              <Square size={16} fill="currentColor" />
            )}
            {!isMobile && <p className="text-sm font-medium">Stop</p>}
          </Button>
        ) : (
          <Button
            type="button"
            onClick={onStart}
            disabled={isStarting || isMediaUploading}
            className="w-10 h-10 p-0 bg-zinc-900 hover:bg-zinc-800 transition-all text-white rounded-md flex items-center justify-center disabled:bg-zinc-300 disabled:text-zinc-500"
            title="Go Live"
            aria-label="Start Automation"
          >
            {isStarting && !isMediaUploading ? (
              <RefreshCw size={18} className="animate-spin" />
            ) : (
              // Wait, the mobile design screenshot image showed a Play button in dark background for play, and some green Live label.
              <Play />
            )}
          </Button>
        )}

        {/* Live badge replacing text on mobile */}
        {isActive && (
          <div
            className={`h-10 ${isMobile ? "px-3" : "px-4"} rounded-md border-2 border-green-500 text-green-600 text-sm font-bold flex items-center gap-1.5 shrink-0 bg-white`}
          >
            <span className="w-2 h-2 rounded-sm bg-green-500 animate-pulse shrink-0" />
            {!isMobile && "Live"}
          </div>
        )}
      </div>
    </div>
  );
}
