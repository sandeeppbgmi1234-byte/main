import React from "react";
import { Button } from "@/components/ui/button";
import { PLANS, type PlanId } from "@/configs/plans.config";
import { getUserBillingData } from "@/server/services/billing/subscription.service";
import { PaymentMethod, BillingHistory } from "./index";

import {
  calculateProgress,
  formatBillingDate,
  getPlanLabel,
} from "@/lib/billing";
import Link from "next/link";

export async function BillingTab({ userId }: { userId: string }) {
  let data: Awaited<ReturnType<typeof getUserBillingData>> | null = null;
  try {
    data = await getUserBillingData(userId);
  } catch (error) {
    console.error("Failed to fetch billing data:", error);
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4 text-center">
        <div className="bg-red-50 p-4 rounded-xl border border-red-100 max-w-md">
          <h3 className="text-red-800 font-bold mb-1">
            Unable to load billing
          </h3>
          <p className="text-red-600 text-sm leading-relaxed">
            We ran into an issue retrieving your subscription details. Please
            try refreshing the page or contact support if this persists.
          </p>
        </div>
      </div>
    );
  }

  if (!data || !data.subscription) {
    return (
      <div className="flex items-center justify-center h-48">
        <p className="text-slate-400">No billing information found.</p>
      </div>
    );
  }

  const { subscription, ledger, invoices } = data;

  // Fallback to FREE plan details if no subscription exists
  const currentPlanId = (subscription?.plan as PlanId) || "FREE";
  const planInfo = PLANS[currentPlanId];

  const creditsUsed = ledger?.creditsUsed ?? 0;
  const creditLimit = ledger?.creditLimit ?? planInfo.creditLimit;
  const isUnlimited = creditLimit === -1;
  const progress = calculateProgress(creditsUsed, creditLimit);

  const hasPayment = !!subscription?.paymentMethod;
  const hasHistory = invoices.length > 0;
  const hasBottomRow = hasPayment || hasHistory;

  return (
    <div className="flex flex-col items-center max-w-4xl mx-auto w-full gap-6">
      {/* Main Plan Card */}
      <div className="w-full bg-white border-none md:rounded-xl rounded-b-xl p-5 md:p-0 flex flex-col gap-6">
        <div className="md:text-center text-start">
          <h2 className="md:text-2xl text-lg font-semibold text-[#111827] mb-2 tracking-tight">
            Billing Information
          </h2>
          <p className="text-[#4B5563] text-sm md:text-[15px] mx-auto leading-relaxed">
            Update your payment information or switch plans according to your
            needs.
          </p>
        </div>
        <div className="md:border md:border-[#E5E7EB] flex flex-col gap-6 md:p-8 md:rounded-xl">
          {/* Plan Header */}
          <div className=" flex items-start justify-between">
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-3">
                <span className="md:text-[22px] text-lg font-bold bg-linear-to-r from-[#6A06E4] to-[#C026D3] bg-clip-text text-transparent">
                  {getPlanLabel(currentPlanId)}
                </span>
                <span className="px-2.5 py-0.5 rounded-md bg-[#DCFCE7] text-[#166534] md:text-sm text-[8px] font-bold uppercase tracking-wider border border-[#BBF7D0]">
                  {subscription?.status || "ACTIVE"}
                </span>
              </div>
              <p className="md:text-[15px] text-sm text-[#6B7280] font-medium">
                {formatBillingDate(subscription?.currentPeriodStart)} -{" "}
                {formatBillingDate(subscription?.currentPeriodEnd)}
              </p>
            </div>

            <Button
              className="bg-[#0D0D15] hover:opacity-90 text-white text-xs font-normal transition-all duration-300 active:scale-95 border-none"
              asChild
            >
              <Link href="/dash/billing">Upgrade</Link>
            </Button>
          </div>

          {/* Credit Limit Progress */}
          <div className="space-y-3 mt-2">
            <div className="relative w-full h-[14px] bg-[#F3E8FF] rounded-full overflow-hidden">
              {/* Progress Fill */}
              {!isUnlimited && (
                <div
                  className="absolute left-0 top-0 h-full bg-[#6A06E4] rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${progress}%` }}
                />
              )}
              {isUnlimited && (
                <div className="absolute left-0 top-0 h-full bg-linear-to-r from-[#6A06E4] to-[#C026D3] w-full rounded-full" />
              )}
            </div>
            <div className="flex justify-between items-center text-[13px] font-semibold text-[#4B5563]">
              <span className="text-[#6A06E4]">{creditsUsed}</span>
              <span className="text-[#9CA3AF]">
                {isUnlimited ? "Unlimited" : creditLimit}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Grid: Payment Method & History */}
      {hasBottomRow && (
        <div
          className={`grid grid-cols-1 ${hasPayment && hasHistory ? "md:grid-cols-2" : ""} gap-6 w-full`}
        >
          {hasPayment && (
            <PaymentMethod
              method={subscription.paymentMethod}
              detail={subscription.paymentDetail}
            />
          )}
          {hasHistory && <BillingHistory invoices={invoices} />}
        </div>
      )}
    </div>
  );
}
