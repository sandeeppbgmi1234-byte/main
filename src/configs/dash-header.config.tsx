import React from "react";
import { CreateAutomationDialog } from "@/components/dash/automations/create";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import PlusIconSvg from "@/assets/svgs/addthis.svg";
import Image from "next/image";

import { Download } from "lucide-react";
import { cn } from "@/server/utils";
import { CreditIndicator } from "@/app/dash/_components";
import { RefreshInstaDialog } from "@/app/auth/_components/RefreshInstaDialog";

import { NewFormButton } from "@/components/dash/forms/NewFormButton";

export interface HeaderConfig {
  showSearch: boolean;
  childComp: React.ReactNode;
  hideHeader?: boolean;
}

const CONTACTS_BUTTON_CLASSES =
  "h-full shrink-0 bg-[#7C3AED] hover:bg-[#6D28D9] text-white transition-colors";

export const DASHBOARD_HEADER_CONFIG: Record<string, HeaderConfig> = {
  "/dash": {
    showSearch: false,
    childComp: (
      <>
        <RefreshInstaDialog />
        <CreateAutomationDialog title="New Automation" />
      </>
    ),
  },
  "/dash/automations": {
    showSearch: true,
    childComp: (
      <>
        <CreditIndicator />
        <RefreshInstaDialog />
        <CreateAutomationDialog title="New Automation" />
      </>
    ),
  },
  "/dash/forms": {
    showSearch: true,
    childComp: (
      <>
        <RefreshInstaDialog />
        <NewFormButton />
      </>
    ),
  },
  "/dash/contacts": {
    showSearch: true,
    childComp: (
      <Button
        className={cn(
          CONTACTS_BUTTON_CLASSES,
          "gap-2 px-4 opacity-70 cursor-not-allowed",
        )}
        type="button"
        disabled
        title="Export feature coming soon"
      >
        <Download size={15} />
        Export List
      </Button>
    ),
  },
};

export const getHeaderConfig = (pathname: string): HeaderConfig | null => {
  // Exact match for now, can be extended to prefix match if needed
  return DASHBOARD_HEADER_CONFIG[pathname] || null;
};
