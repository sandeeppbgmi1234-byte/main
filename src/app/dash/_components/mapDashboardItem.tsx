"use client";

import React from "react";
import Image from "next/image";
import { FileText, User } from "lucide-react";
import { AutomationListItem } from "@/api/services/automations/types";
import { FormListItem } from "@/api/services/forms/form";
import { Contact } from "@/api/services/contacts/types";
import { getAutomationRoute, getAutomationLabel } from "@/utils/automation";
import { StatusBadge } from "@/components/shared/StatusBadge";

export type DashboardItem = AutomationListItem | FormListItem | Contact;

interface MappedDashboardItem {
  id: string;
  title: string;
  subtitle: string;
  image: React.ReactNode;
  status: React.ReactNode;
  statusText: string;
  stats: string | number;
  statsLabel: string;
  secondaryStats?: number;
  secondaryStatsLabel?: string;
  newFollowersGained?: number;
  date: string;
  dateLabel: string;
  href: string | null;
  raw: DashboardItem;
}

/**
 * Shared hook to map raw dashboard data (Forms, Automations, or Contacts) into a unified UI structure.
 * This ensures consistency between desktop TableRow and mobile MobileCard.
 */
const mapDashboardItem = (data: DashboardItem): MappedDashboardItem => {
  const isAutomation = data.type === "automation";
  const isForm = data.type === "form";
  const isContact = data.type === "contact";

  const safeFormatDate = (date: string | Date | null | undefined) => {
    if (!date) return "—";
    const d = new Date(date);
    if (isNaN(d.getTime())) return "—";

    const secondsAgo = Math.floor((Date.now() - d.getTime()) / 1000);
    if (secondsAgo >= 0 && secondsAgo < 60) {
      return "just now";
    }

    return d.toLocaleDateString();
  };

  if (isAutomation) {
    const automation = data as AutomationListItem;
    const imageUrl =
      automation.post?.thumbnailUrl ||
      automation.post?.mediaUrl ||
      automation.story?.thumbnailUrl ||
      automation.story?.mediaUrl;

    const currentStatus =
      automation.story &&
      Date.now() - new Date(automation.story.timestamp).getTime() >=
        24 * 60 * 60 * 1000
        ? "EXPIRED"
        : (automation.status as string);

    return {
      id: automation.id,
      title: automation.automationName || "Unnamed Automation",
      subtitle:
        automation.post?.caption ||
        automation.story?.caption ||
        (automation.triggers.length > 0
          ? `Keywords: ${automation.triggers.join(", ")}`
          : "No keyword triggers"),
      href: getAutomationRoute(automation.triggerType, automation.id),
      image:
        typeof imageUrl === "string" && imageUrl.trim().length > 0 ? (
          <Image
            alt="Media preview"
            src={imageUrl}
            width={40}
            height={40}
            className="rounded-lg object-cover w-full h-full"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-slate-100 text-[10px] text-slate-400 font-bold uppercase text-center p-1">
            {getAutomationLabel(automation.triggerType) || "Auto"}
          </div>
        ),
      status: <StatusBadge status={currentStatus} />,
      statusText: currentStatus,
      stats: automation._count.executions,
      statsLabel: "Runs",
      newFollowersGained: automation.newFollowersGained,
      date: safeFormatDate(automation.lastTriggeredAt),
      dateLabel: "Last Triggered",
      raw: data,
    };
  }

  if (isForm) {
    const form = data as FormListItem;
    return {
      id: form.id,
      title: form.name || "Untitled Form",
      subtitle: "",
      href: `/dash/forms/${form.id}`,
      image:
        typeof form.coverImage === "string" &&
        form.coverImage.trim().length > 0 ? (
          <div className="w-full h-full flex items-center justify-center bg-white rounded-lg overflow-hidden border border-slate-100">
            <Image
              src={form.coverImage}
              className="h-full w-full object-cover"
              height={100}
              width={100}
              alt={form.name || "Untitled Form"}
            />
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-slate-50 rounded-lg text-slate-300">
            <FileText size={20} />
          </div>
        ),
      status: (
        <span
          className={`text-base font-semibold px-2 py-0.5 ${
            form.status === "PUBLISHED" ? "text-[#068E19]" : "text-[#1D81D8]"
          }`}
        >
          {form.status === "PUBLISHED" ? "Live" : "Draft"}
        </span>
      ),
      statusText: form.status,
      stats: form.submissionCount,
      statsLabel: "Submissions",
      date: safeFormatDate(form.updatedAt),
      dateLabel: "Last Updated",
      raw: data,
    };
  }

  // Handle Contacts
  const contact = data as Contact;
  return {
    id: contact.id,
    title: contact.username,
    subtitle: "",
    href: null,
    image: contact.avatarUrl ? (
      <Image
        src={contact.avatarUrl}
        alt={contact.username}
        width={40}
        height={40}
        className="h-full w-full object-cover"
      />
    ) : (
      <User className="w-4 h-4 text-slate-300" strokeWidth={2.5} />
    ),
    status: (
      <span className="text-[16px] text-center font-semibold text-purple-600">
        {contact.kind}
      </span>
    ),
    statusText: contact.kind,
    stats: contact.email || "Not Found",
    statsLabel: "Email",
    date: safeFormatDate(contact.lastInteractedAt),
    dateLabel: "Last Interacted",
    raw: data,
  };
};

export default mapDashboardItem;
