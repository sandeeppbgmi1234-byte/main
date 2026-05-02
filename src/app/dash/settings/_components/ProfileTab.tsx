import React from "react";
import { Check } from "lucide-react";
import Link from "next/link";
import { ProfileData } from "../types";
import { UpgradeTooltip } from "@/components/shared/UpgradeTooltip";
import CrownIcon from "@/assets/svgs/CrownIcon.svg";
import Image from "next/image";

interface ProfileTabProps {
  data: ProfileData;
}

export function ProfileTab({ data }: ProfileTabProps) {
  const isBlackTier = data.planId === "BLACK";
  const accountsCount = data.accounts.length;
  // Black tier allows 2 accounts total
  const canAddAccount = isBlackTier && accountsCount < 2;

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 text-left">
      {/* Left Column: Email */}
      <div className="flex flex-col gap-6">
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-[#111827]">Connected Email</h2>
          <p className="text-[#6B7280] text-[14px]">
            Change the settings for your current workspace
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <div className="bg-[#F9FAFB] rounded-lg p-5 flex items-center justify-between border border-[#F3F4F6]">
            <span className="text-[16px] font-medium text-[#111827]">
              {data.email}
            </span>
            {data.isEmailVerified && (
              <div className="bg-[#22C55E] rounded-full p-1.5 shadow-sm">
                <Check size={12} className="text-white" strokeWidth={4} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right Column: Accounts */}
      <div className="flex flex-col gap-6">
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-[#111827]">
            Connected Accounts
          </h2>
          <p className="text-[#6B7280] text-[14px]">
            Change the settings for your current workspace
          </p>
        </div>

        <div className="flex flex-col gap-4">
          {data.accounts.map((account) => (
            <div key={account.id} className="space-y-2">
              <div className="bg-[#F9FAFB] rounded-sm p-3 flex items-center justify-between border border-[#F3F4F6]">
                <span className="text-sm font-medium text-[#111827]">
                  @{account.username}
                </span>
                {/* Remove button ignored as per request */}
              </div>
              <p className="text-[#9CA3AF] text-xs font-normal px-2">
                User Since: {formatDate(account.connectedAt)}
              </p>
            </div>
          ))}

          {/* Action Button */}
          {!isBlackTier ? (
            <UpgradeTooltip>
              <Link
                href="/dash/billing"
                className="w-full bg-[#6A06E4] hover:bg-[#5B05C2] text-white p-3 rounded-sm flex items-center justify-center gap-2 font-semibold text-sm transition-all active:scale-[0.98] mt-2"
              >
                Add New Account
                <Image src={CrownIcon} width={20} height={20} alt="" />
              </Link>
            </UpgradeTooltip>
          ) : canAddAccount ? (
            <Link
              href={
                accountsCount > 0 ? "/auth/connect/workspace" : "/auth/connect"
              }
              className="w-full py-3 bg-[#6A06E4] hover:bg-[#5B05C2] text-white rounded-sm flex items-center justify-center gap-2 font-bold text-[16px] transition-all active:scale-[0.98] mt-2"
            >
              Add New Account
            </Link>
          ) : (
            <button
              disabled
              className="w-full h-[54px] bg-[#F3F4F6] text-[#9CA3AF] rounded-sm flex items-center justify-center gap-2 font-bold text-[16px] transition-all cursor-not-allowed mt-2"
            >
              Account Limit Reached
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
