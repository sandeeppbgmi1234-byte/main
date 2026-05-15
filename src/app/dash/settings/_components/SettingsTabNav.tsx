import React from "react";
import Link from "next/link";
import { headers } from "next/headers";
import { SETTINGS_CONFIG } from "../config";
import { SettingsTab } from "../types";
import { cn } from "@/server/utils";

export async function SettingsTabNav() {
  const headerList = await headers();
  const currentUrl = headerList.get("x-url") || "";

  // Extract the tab from the URL query string
  const url = new URL(currentUrl, "http://localhost");
  const rawTab = url.searchParams.get("tab");

  const isValidTab = SETTINGS_CONFIG.TABS.some((t) => t.id === rawTab);
  const activeTab = isValidTab
    ? (rawTab as SettingsTab)
    : SETTINGS_CONFIG.DEFAULT_TAB;

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 w-full">
      <h1 className="hidden md:block text-xl font-bold text-[#071329] shrink-0">
        Setting
      </h1>
      <div className="flex items-center w-full gap-4" role="tablist">
        {SETTINGS_CONFIG.TABS.map((tab, index) => {
          const isActive = activeTab === tab.id;
          const { Icon } = tab;

          return (
            <React.Fragment key={tab.id}>
              <Link
                href={`?tab=${tab.id}`}
                role="tab"
                aria-selected={isActive}
                style={{ flex: 1 }}
                className={cn(
                  "flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 transition-all duration-200 font-medium text-sm sm:text-base whitespace-nowrap",
                  isActive
                    ? "text-[#6A06E4] border-b-2 border-[#6A06E4] md:border-none md:bg-[#F7F0FF] md:rounded-lg rounded-none bg-transparent"
                    : "bg-transparent md:rounded-lg md:bg-[#F9F9F9] text-[#4A5568] md:hover:bg-gray-100 rounded-none",
                )}
              >
                <Icon
                  size={18}
                  className={isActive ? "text-[#6A06E4]" : "text-[#4A5568]"}
                />
                <span>{tab.label}</span>
              </Link>

              {index !== SETTINGS_CONFIG.TABS.length - 1 && (
                <div
                  className="md:hidden h-6 w-px bg-[#E2E8F0]"
                  aria-hidden="true"
                  role="presentation"
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
