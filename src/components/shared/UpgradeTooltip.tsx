"use client";

import React from "react";
import { Tooltip as TooltipPrimitive } from "radix-ui";
import { Tooltip, TooltipTrigger } from "@/components/ui/tooltip";

interface UpgradeTooltipProps {
  children: React.ReactNode;
  side?: "top" | "bottom" | "left" | "right";
  sideOffset?: number;
}

// Wraps any trigger element with the "To use this feature you need to upgrade!" bubble on hover.
export function UpgradeTooltip({
  children,
  side = "bottom",
  sideOffset = 14,
}: UpgradeTooltipProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>

      {/* Arrow-free upgrade bubble — no Radix arrow via raw primitive */}
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Content
          side={side}
          sideOffset={sideOffset}
          className="z-50 bg-[#E9D5FF] text-[#2E1065] border border-[#9B4DCA] px-7 py-5 rounded-lg shadow-sm animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95"
        >
          <p className="text-center font-medium text-[16px] leading-snug">
            To use this feature <br /> you need to upgrade!
          </p>
        </TooltipPrimitive.Content>
      </TooltipPrimitive.Portal>
    </Tooltip>
  );
}
