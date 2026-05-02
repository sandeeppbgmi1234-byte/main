import React from "react";
import { cn } from "@/server/utils";

interface DashboardCardProps {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

/**
 * Common shell for dashboard widgets to ensure consistent look and feel.
 * Implements standard padding, borders, and rounded corners.
 */
export function DashboardCard({
  title,
  action,
  children,
  className,
}: DashboardCardProps) {
  return (
    <div
      className={cn(
        "bg-white rounded-lg p-6 border border-gray-100 flex flex-col gap-2 min-h-[380px] w-full max-w-sm",
        className,
      )}
    >
      {/* Header section with title and optional action (dropdown, link, etc) */}
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-[#071329] font-semibold text-[16px] tracking-tight">
          {title}
        </h3>
        {action && <div className="flex items-center">{action}</div>}
      </div>

      {/* Main Content Area */}
      {children}
    </div>
  );
}

/**
 * Reusable skeleton for dashboard widgets to prevent layout shift.
 */
export function DashboardCardSkeleton() {
  return (
    <div className="bg-white rounded-[32px] p-7 border border-gray-100 w-full max-w-sm h-[380px] animate-pulse">
      <div className="flex justify-between mb-8">
        <div className="h-6 w-32 bg-slate-100 rounded" />
        <div className="h-6 w-16 bg-slate-100 rounded" />
      </div>
      <div className="space-y-4 flex-1">
        <div className="h-10 w-48 bg-slate-100 rounded" />
        <div className="h-4 w-32 bg-slate-100 rounded" />
        <div className="h-4 w-full bg-slate-100 rounded-full" />
      </div>
    </div>
  );
}
