"use client";

import React from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import { TableVariant } from "@/configs/table.config";

export type AutomationStatus = "ACTIVE" | "STOPPED" | "EXPIRED";
export type FormStatus = "PUBLISHED" | "DRAFT";
export type ContactStatus = "POST" | "REEL" | "STORY";

export type StatusFilterMap = {
  automations: AutomationStatus;
  forms: FormStatus;
  contacts: ContactStatus;
};

export type StatusFilter = StatusFilterMap[TableVariant] | "ALL";

export type AutomationStatusFilter = AutomationStatus | "ALL";
export type FormStatusFilter = FormStatus | "ALL";
export type ContactStatusFilter = ContactStatus | "ALL";

export type TriggerFilter = "COMMENT" | "DM" | "STORY" | "ALL";

/**
 * Gets the status options for a specific table variant, typed to that variant.
 */
export function getStatusOptions<V extends TableVariant>(
  variant: V,
): { label: string; value: StatusFilterMap[V] }[] {
  if (variant === "forms") {
    return [
      { label: "Live", value: "PUBLISHED" as StatusFilterMap[V] },
      { label: "Draft", value: "DRAFT" as StatusFilterMap[V] },
    ];
  }
  if (variant === "contacts") {
    return [
      { label: "Post", value: "POST" as StatusFilterMap[V] },
      { label: "Reel", value: "REEL" as StatusFilterMap[V] },
      { label: "Story", value: "STORY" as StatusFilterMap[V] },
    ];
  }
  return [
    { label: "Live", value: "ACTIVE" as StatusFilterMap[V] },
    { label: "Stopped", value: "STOPPED" as StatusFilterMap[V] },
    { label: "Expired", value: "EXPIRED" as StatusFilterMap[V] },
  ] as { label: string; value: StatusFilterMap[V] }[];
}

export const getTriggerOptions = (): {
  label: string;
  value: Exclude<TriggerFilter, "ALL">;
}[] => {
  return [
    { label: "Comment", value: "COMMENT" },
    { label: "DM", value: "DM" },
    { label: "Story", value: "STORY" },
  ];
};

interface TableFilterMenuProps<V extends TableVariant> {
  variant: V;
  statusFilter: StatusFilterMap[V] | "ALL";
  onStatusChange: (status: StatusFilterMap[V] | "ALL") => void;
  triggerFilter?: TriggerFilter;
  onTriggerChange?: (trigger: TriggerFilter) => void;
  children: React.ReactElement;
}

/**
 * Reusable filter menu for dashboard tables (Desktop and Mobile).
 */
export const TableFilterMenu = <V extends TableVariant>({
  variant,
  statusFilter,
  onStatusChange,
  triggerFilter,
  onTriggerChange,
  children,
}: TableFilterMenuProps<V>) => {
  const toggleStatus = (val: StatusFilterMap[V]) => {
    onStatusChange(
      statusFilter === val ? ("ALL" as StatusFilterMap[V] | "ALL") : val,
    );
  };

  const toggleTrigger = (val: Exclude<TriggerFilter, "ALL">) => {
    if (variant === "automations" && onTriggerChange) {
      onTriggerChange(triggerFilter === val ? "ALL" : val);
    }
  };

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="min-w-[150px] p-1.5 rounded-xl bg-white border border-slate-100 shadow-xl"
      >
        <DropdownMenuLabel className="px-3 pt-2 pb-1 text-sm font-medium text-slate-900 border-b border-slate-50 mb-1">
          Filter By
        </DropdownMenuLabel>

        {/* Trigger Filters (Specific to Automations) */}
        {variant === "automations" &&
          getTriggerOptions().map((opt) => (
            <DropdownMenuCheckboxItem
              key={opt.value}
              checked={triggerFilter === opt.value}
              onCheckedChange={() => toggleTrigger(opt.value)}
              className="cursor-pointer font-medium text-[#212121] data-[state=checked]:text-[#6A06E4]"
            >
              {opt.label}
            </DropdownMenuCheckboxItem>
          ))}

        {/* Status Filters */}
        {getStatusOptions(variant).map((opt) => (
          <DropdownMenuCheckboxItem
            key={opt.value}
            checked={statusFilter === opt.value}
            onCheckedChange={() => toggleStatus(opt.value)}
            className="cursor-pointer font-medium text-[#212121] data-[state=checked]:text-[#6A06E4]"
          >
            {opt.label}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
