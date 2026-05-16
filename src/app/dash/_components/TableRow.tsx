"use client";

import React, { useState } from "react";
import Link from "next/link";
import type { AutomationListItem } from "@/api/services/automations/types";
import type { FormListItem } from "@/api/services/forms/form";
import type { Contact } from "@/api/services/contacts/types";
import { AutomationActionsMenu } from "@/components/dash/automations/AutomationActionsMenu";
import { FormActionsMenu } from "../forms/_components/FormActionsMenu";
import { MoreVertical, Copy } from "lucide-react";
import { toast } from "sonner";
import mapDashboardItem from "./mapDashboardItem";
import { TABLE_CONFIGS, TableVariant } from "@/configs/table.config";
import { Separator } from "@/components/ui/separator";

/**
 * Props for the dumb UI component.
 */
export interface TableRowUIProps {
  variant: TableVariant;
  icon: React.ReactNode;
  title: string;
  subtitle?: string | React.ReactNode;
  href: string | null;
  status: React.ReactNode;
  stats: string | number;
  date: React.ReactNode;
  actions: React.ReactNode;
  actionBtn?: React.ReactNode;
  className?: string;
  newFollowersGained: number;
}

/**
 * Purely presentational component that renders the table row structure.
 */
const TableRowUI = ({
  variant,
  icon,
  title,
  subtitle,
  href,
  status,
  stats,
  date,
  actions,
  actionBtn,
  className = "",
  newFollowersGained,
}: TableRowUIProps) => {
  const config = TABLE_CONFIGS[variant];

  return (
    <div
      className={`grid ${config.gridClass} items-center px-8 py-4 gap-4 border-b border-slate-50 last:border-0 hover:bg-slate-50/60 transition-colors group/row ${className}`}
    >
      {config.columns.map((col) => {
        const colId = col.id as string;
        const isAutomation = variant === "automations";
        const isForm = variant === "forms";
        const isContact = variant === "contacts";
        const hasSeparator =
          (isAutomation && ["followers", "status", "count"].includes(col.id)) ||
          (isForm && ["count", "status"].includes(col.id)) ||
          (isContact && ["type", "email"].includes(col.id));

        let content = null;

        if (col.type === "main") {
          content = (
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-md bg-slate-50 shrink-0 flex items-center justify-center overflow-hidden border border-slate-100">
                {icon}
              </div>
              {href ? (
                <Link
                  href={href}
                  className="flex flex-col gap-0.5 group min-w-0"
                >
                  <span className="text-[16px] font-medium text-slate-800 group-hover:text-[#6A06E4] transition-colors truncate">
                    {title}
                  </span>
                  {subtitle && (
                    <span className="text-xs text-slate-400 truncate max-w-[260px]">
                      {subtitle}
                    </span>
                  )}
                </Link>
              ) : (
                <div className="flex flex-col gap-0.5 min-w-0">
                  <span className="text-[16px] font-medium text-slate-800 truncate">
                    {title}
                  </span>
                  {subtitle && (
                    <span className="text-xs text-slate-400 truncate max-w-[260px]">
                      {subtitle}
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        } else if (col.type === "info") {
          let infoContent: React.ReactNode = stats;
          if (colId === "type") infoContent = status;
          if (colId === "followers" || (isForm && colId === "count")) {
            infoContent = (
              <span className="text-[#6A06E4] font-medium">
                {colId === "followers" ? newFollowersGained : stats}
              </span>
            );
          }

          content = (
            <span className="text-center text-[16px] font-medium text-[#212121] truncate">
              {infoContent}
            </span>
          );
        } else if (col.type === "status") {
          content = (
            <div className="flex items-center justify-center gap-2 overflow-hidden">
              {status}
            </div>
          );
        } else if (col.type === "date") {
          content = (
            <span className="text-center text-sm text-slate-500 whitespace-nowrap">
              {date}
            </span>
          );
        } else if (col.type === "actionBtn") {
          content = <div className="flex justify-center">{actionBtn}</div>;
        } else if (col.type === "actions") {
          content = <div className="flex justify-end">{actions}</div>;
        }

        return (
          <div
            key={col.id}
            className="flex items-center justify-center relative h-full"
          >
            <div
              className={`flex-1 flex ${col.type === "main" ? "justify-start" : "justify-center"}`}
            >
              {content}
            </div>
            {hasSeparator && (
              <div className="absolute -right-2 h-4 flex items-center">
                <Separator
                  orientation="vertical"
                  className="bg-slate-900 w-2"
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

/**
 * Maps Automation and Form data to TableRow UI pieces.
 */
/**
 * Main component that decides what to render based on input data.
 * Refactored to use a shared mapper for consistency with mobile views.
 */
type TableRowProps =
  | { variant: "forms"; data: FormListItem }
  | { variant: "automations"; data: AutomationListItem }
  | { variant: "contacts"; data: Contact };

const TableRow = ({ data, variant }: TableRowProps) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const mapped = mapDashboardItem(data);

  const isForm = variant === "forms";
  const isAutomation = variant === "automations";

  const copyToClipboard = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (variant !== "forms") return;
    const slug = data.slug;
    if (!slug) return;

    const url = `${window.location.origin}/f/${slug}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard!");
    } catch {
      toast.error("Failed to copy to clipboard.");
    }
  };

  const slug = isForm ? data.slug : undefined;

  const actionBtn = isForm ? (
    <button
      onClick={copyToClipboard}
      disabled={!slug}
      className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-[#6A06E5] hover:bg-purple-50 transition-colors text-sm font-medium whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <Copy size={14} />
      Copy
    </button>
  ) : null;

  const actions = (
    <div className="relative flex items-center gap-2 justify-end">
      {(isForm || isAutomation) && (
        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:outline-none"
            title="More actions"
          >
            <MoreVertical size={16} />
          </button>
          {menuOpen &&
            (variant === "automations" ? (
              <AutomationActionsMenu
                onClose={() => setMenuOpen(false)}
                fullAutomation={data}
              />
            ) : variant === "forms" ? (
              <FormActionsMenu
                formId={data.id}
                onClose={() => setMenuOpen(false)}
                slug={data.slug}
              />
            ) : null)}
        </div>
      )}
    </div>
  );

  return (
    <TableRowUI
      variant={variant}
      icon={mapped.image}
      title={mapped.title}
      subtitle={mapped.subtitle}
      href={mapped.href}
      status={mapped.status}
      stats={mapped.stats}
      newFollowersGained={mapped.newFollowersGained || 0}
      date={mapped.date}
      actionBtn={actionBtn}
      actions={actions}
    />
  );
};

export default TableRow;
