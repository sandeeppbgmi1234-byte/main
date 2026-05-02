/**
 * BillingCard component: handles plan display and checkout initiation.
 */

"use client";

import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import { type PlanId } from "@/configs/plans.config";
import { billingService } from "@/api/services/billing";

interface BillingCardProps {
  plan: {
    id: PlanId;
    creditLimit: number;
    maxAccounts: number;
    hasLeadGen: boolean;
    priceInRupees: number;
  };
  isCurrent: boolean;
}

export function BillingCard({ plan, isCurrent }: BillingCardProps) {
  const [loading, setLoading] = useState(false);
  const isCreatingCheckoutRef = useRef(false);
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, []);

  async function handleCheckout() {
    if (isCreatingCheckoutRef.current) return;

    setLoading(true);
    isCreatingCheckoutRef.current = true;

    try {
      const { checkoutUrl } = await billingService.checkout(plan.id);

      if (!checkoutUrl) {
        throw new Error("No checkout URL returned from server.");
      }

      // Calculate popup position to center it
      const width = 600;
      const height = 800;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;

      const checkoutWindow = window.open(
        checkoutUrl,
        "DM_Broo_Checkout",
        `width=${width},height=${height},left=${left},top=${top},status=no,menubar=no,toolbar=no`,
      );

      if (!checkoutWindow) {
        throw new Error("Popup blocked. Please allow popups for this site.");
      }

      // Start polling to detect when the window is closed
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);

      pollTimerRef.current = setInterval(() => {
        if (checkoutWindow.closed) {
          if (pollTimerRef.current) clearInterval(pollTimerRef.current);
          window.location.reload();
        }
      }, 1000);
    } catch (error: any) {
      console.error("[CHECKOUT_ERROR]", error);
      toast.error(
        error.message || "Failed to initiate checkout. Please try again.",
      );

      setLoading(false);
      isCreatingCheckoutRef.current = false;
    }
  }

  return (
    <div
      className={`relative p-8 rounded-3xl border transition-all duration-300 ${
        isCurrent
          ? "bg-primary/5 border-primary   ring-1 ring-primary/20"
          : "bg-card hover:border-primary/50"
      }`}
    >
      {isCurrent && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest   ">
          Current Plan
        </span>
      )}

      <div className="space-y-6">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight">{plan.id}</h2>
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-extrabold">
              ₹{plan.priceInRupees}
            </span>
            <span className="text-muted-foreground font-medium">/mo</span>
          </div>
        </div>

        <ul className="space-y-4 py-4 min-h-[160px]">
          <li className="flex items-center gap-3">
            <div className="size-5 rounded-full bg-primary/10 flex items-center justify-center">
              <div className="size-2 rounded-full bg-primary" />
            </div>
            <span className="text-sm font-medium">
              {plan.creditLimit === -1
                ? "Unlimited Credits"
                : `${plan.creditLimit.toLocaleString()} Monthly Credits`}
            </span>
          </li>
          <li className="flex items-center gap-3">
            <div className="size-5 rounded-full bg-primary/10 flex items-center justify-center">
              <div className="size-2 rounded-full bg-primary" />
            </div>
            <span className="text-sm font-medium">
              Connect up to {plan.maxAccounts}{" "}
              {plan.maxAccounts === 1 ? "Account" : "Accounts"}
            </span>
          </li>
          {plan.hasLeadGen && (
            <li className="flex items-center gap-3">
              <div className="size-5 rounded-full bg-primary/10 flex items-center justify-center">
                <div className="size-2 rounded-full bg-primary" />
              </div>
              <span className="text-sm font-medium">
                Full Lead Generation Suite
              </span>
            </li>
          )}
        </ul>

        <button
          onClick={handleCheckout}
          disabled={loading || isCurrent || isCreatingCheckoutRef.current}
          className={`w-full py-4 rounded-2xl font-bold transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100 ${
            isCurrent
              ? "bg-emerald-500/10 text-emerald-600 cursor-default"
              : "bg-primary text-primary-foreground"
          }`}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Redirecting...
            </span>
          ) : isCurrent ? (
            "Current Plan"
          ) : (
            "Upgrade Plan"
          )}
        </button>
      </div>
    </div>
  );
}
