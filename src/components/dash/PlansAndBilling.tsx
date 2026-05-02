import React from "react";
import { CheckCircle2, Clock, XCircle } from "lucide-react";
import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { getUserBillingData } from "@/server/services/billing/subscription.service";
import { PLANS, type PlanId } from "@/configs/plans.config";

import {
  calculateProgress,
  formatBillingDate,
  getPlanLabel,
} from "@/lib/billing";
import { DashboardCard } from "./DashboardCard";

/**
 * PlansAndBilling Component
 * A premium dashboard widget showing subscription status, usage credits, and recent history.
 * Fetches real data on the server for optimal performance and SEO.
 */
const PlansAndBilling = async () => {
  const { userId } = await auth();
  if (!userId) return null;

  let data;
  try {
    data = await getUserBillingData(userId);
  } catch (error) {
    console.error("Failed to fetch billing data for widget:", error);
    return null;
  }

  if (!data) return null;

  const { subscription, ledger, invoices } = data;
  const currentPlanId = (subscription?.plan as PlanId) || "FREE";
  const planInfo = PLANS[currentPlanId];

  const creditsUsed = ledger?.creditsUsed ?? 0;
  const creditLimit = ledger?.creditLimit ?? planInfo.creditLimit;
  const isUnlimited = creditLimit === -1;
  const progress = calculateProgress(creditsUsed, creditLimit);

  const statusConfig = {
    paid: { icon: CheckCircle2, bg: "bg-[#DCFCE7]", text: "text-[#16A34A]" },
    failed: { icon: XCircle, bg: "bg-[#FEE2E2]", text: "text-[#DC2626]" },
    pending: { icon: Clock, bg: "bg-[#FEF3C7]", text: "text-[#D97706]" },
  };

  const action = (
    <div className="flex items-center gap-2">
      {/* <span className="bg-[#DCFCE7] text-[#166534] text-[8px] p-1 border border-[#BBF7D0] font-medium rounded-sm uppercase tracking-widest leading-none">
        {subscription?.status || "ACTIVE"}
      </span> */}
      <Link
        href="/dash/settings?tab=billing"
        className="text-[#6A06E5] font-medium text-lg hover:opacity-80 transition-opacity"
      >
        Manage
      </Link>
    </div>
  );

  return (
    <DashboardCard title="Plans & Billing" action={action}>
      {/* Plan Details */}
      <div className="space-y-4 flex flex-col justify-center">
        <div className="flex flex-col gap-1">
          <h3 className="text-lg font-medium bg-clip-text text-transparent bg-[linear-gradient(90deg,#6A06E4_0%,#E6007A_100%)]">
            {getPlanLabel(currentPlanId)}
          </h3>
          <p className="text-xs text-[#94A3B8] font-medium">
            {formatBillingDate(subscription?.currentPeriodStart)} –{" "}
            {formatBillingDate(subscription?.currentPeriodEnd)}
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <div className="h-3 w-full bg-[#F3E8FF] rounded-full overflow-hidden p-[3px]">
            <div
              className={`h-full rounded-full transition-all duration-1000 ease-out ${
                isUnlimited
                  ? "bg-linear-to-r from-[#6A06E4] to-[#C026D3]"
                  : "bg-[#6A06E4]"
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-end items-center gap-1 text-sm font-normal">
            <span className="text-[#6A06E5]">{creditsUsed}</span>
            <span className="text-[#94A3B8]">
              / {isUnlimited ? "Unlimited" : creditLimit}
            </span>
          </div>
        </div>
      </div>

      {/* Billing History Section */}
      {invoices.length > 0 && (
        <div className="h-full mt-2">
          <h4 className="text-lg font-medium text-[#1E293B] tracking-tight">
            History
          </h4>
          <div className="flex flex-col overflow-y-auto max-h-48 scrollbar-hide">
            {invoices.slice(0, 3).map((invoice, i) => {
              const config =
                statusConfig[invoice.status] || statusConfig.pending;
              const StatusIcon = config.icon;

              return (
                <div key={invoice.id} className="group">
                  <div className="flex items-center justify-between py-3 transition-colors">
                    <span className="text-sm font-medium text-[#1E293B] tracking-tight font-mono">
                      {invoice.id}
                    </span>
                    <div className="flex items-center gap-2">
                      <div className={`${config.bg} p-0.5 rounded-full`}>
                        <StatusIcon
                          size={14}
                          className={`${config.text} fill-current/10`}
                        />
                      </div>
                      <span
                        className={`text-sm font-medium ${config.text} capitalize`}
                      >
                        {invoice.status}
                      </span>
                    </div>
                  </div>
                  {i === 0 && invoices.length > 1 && (
                    <div className="h-px w-full bg-[#F1F5F9]" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </DashboardCard>
  );
};

export default PlansAndBilling;
