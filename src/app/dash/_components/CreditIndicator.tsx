"use client";

import React from "react";
import { useFeatureGates } from "@/hooks/use-feature-gates";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * CreditIndicator: Displays monthly credit usage with a circular progress gauge.
 * Typically used in the dashboard header to show quota status.
 */
export default function CreditIndicator() {
  const { data, isLoading, error } = useFeatureGates();

  if (isLoading) {
    return <Skeleton className="h-9 w-24 rounded-lg" />;
  }

  if (error || !data) {
    return (
      <div className="flex items-center gap-1.5 px-3 h-9 bg-white border border-slate-100 rounded-sm text-[11px] font-bold text-slate-400 uppercase tracking-tight">
        Credits Unavailable
      </div>
    );
  }

  const { creditsUsed, creditLimit } = data.state;

  // Calculate percentage for the circular progress (max 100)
  const percentage =
    creditLimit === 0
      ? creditsUsed > 0
        ? 100
        : 0
      : creditLimit < 0
        ? 0
        : Math.min((creditsUsed / creditLimit) * 100, 100);

  // SVG configuration for the circular gauge
  const size = 18;
  const strokeWidth = 2.5;
  const center = size / 2;
  const radius = center - strokeWidth / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (percentage / 100) * circumference;

  return (
    <div
      className="flex items-center gap-3 px-3 h-full bg-white border border-slate-100 rounded-sm shadow-2xs select-none"
      role="img"
      aria-label={`${creditsUsed.toLocaleString()} of ${creditLimit === -1 ? "unlimited" : creditLimit.toLocaleString()} credits used`}
    >
      {/* Circular Progress Gauge */}
      <div className="relative inline-flex items-center justify-center">
        <svg
          width={size}
          height={size}
          className="-rotate-90"
          aria-hidden="true"
        >
          {/* Background circle */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="transparent"
            stroke="#E2E8F0" // slate-200
            strokeWidth={strokeWidth}
          />
          {/* Progress circle */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="transparent"
            stroke="#0F172A" // slate-900 (Darker for better contrast as per image)
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            style={{
              strokeDashoffset: dashOffset,
              transition: "stroke-dashoffset 0.5s ease-out",
            }}
            strokeLinecap="round"
          />
        </svg>
      </div>

      {/* Usage Numbers */}
      <div className="flex items-center gap-1.5 text-[13px] font-medium leading-none">
        <span className="text-slate-900 font-bold">
          {creditsUsed.toLocaleString()}
        </span>
        <span className="text-slate-300 font-normal">/</span>
        <span className="text-slate-400 font-normal">
          {creditLimit === -1 ? "∞" : creditLimit.toLocaleString()}
        </span>
      </div>
    </div>
  );
}
