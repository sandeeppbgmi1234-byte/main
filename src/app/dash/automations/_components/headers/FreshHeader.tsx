import { RefreshCw, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RefreshInstaDialog } from "@/app/auth/_components/RefreshInstaDialog";
import EditableAutomationName from "./EditableAutomationName";
import AntennaIcon from "@/assets/svgs/antenna_radiowaves_left_right.svg";
import Image from "next/image";

interface FreshHeaderProps {
  isPending: boolean;
  isMediaUploading?: boolean;
  automationName: string;
  onNameChange: (name: string) => void;
  breadcrumb?: string;
  isMobile?: boolean; // Layout adaptation
  isNameDialogOpen?: boolean; // Controlled name popup
  setIsNameDialogOpen?: (open: boolean) => void;
}

export default function FreshHeader({
  isPending,
  isMediaUploading,
  automationName,
  onNameChange,
  breadcrumb = "DM For Comment",
  isMobile = false,
  isNameDialogOpen,
  setIsNameDialogOpen,
}: FreshHeaderProps) {
  const isActuallyPending = isPending && !isMediaUploading;

  return (
    <div className="flex h-full w-full gap-2 items-center animate-in fade-in duration-300">
      {/* Breadcrumb + name display */}
      <div className="grow flex-2 bg-white rounded-md px-4 flex items-center justify-between h-10 min-w-0 gap-4">
        {!isMobile && (
          <p className="text-sm font-semibold flex items-center truncate shrink-0">
            <span className="opacity-50 shrink-0">
              Automation / {breadcrumb} /{" "}
            </span>
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

      <RefreshInstaDialog />

      <Button
        type="submit"
        className="bg-[#068E19] hover:bg-green-600 transition-all text-white rounded-md justify-center flex items-center p-0 disabled:bg-gray-200 disabled:text-gray-400 disabled:opacity-100 flex-none h-10 px-4"
        disabled={isPending || isMediaUploading}
      >
        {isActuallyPending ? (
          <>
            <RefreshCw size={18} className="animate-spin shrink-0" />
            {!isMobile && (
              <span className="ml-2 font-bold whitespace-nowrap">
                Going Live…
              </span>
            )}
          </>
        ) : (
          <>
            <Image alt="" src={AntennaIcon} className="w-5 h-5 text-white" />
            <span className="ml-1 font-bold whitespace-nowrap">Go Live</span>
          </>
        )}
      </Button>
    </div>
  );
}
