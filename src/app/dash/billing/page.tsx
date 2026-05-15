/**
 * Billing Management Page
 * Displays current subscription plan, credit usage, and upgrade options.
 */

import { getFeatureGates } from "@/server/services/billing/feature-gates";
import { PLANS, PlanId } from "@/configs/plans.config";
import { BillingCard } from "./_components/billing-card";
import { UsageBar } from "./_components/usage-bar";

import { workspaceService } from "@/server/workspace/service";

export default async function BillingPage() {
  const { clerkId: clerkUserId } = await workspaceService.getVerifiedContext();

  // Fetch current state using the unified billing governor
  const { state } = await getFeatureGates(clerkUserId);
  const { currentPlan, creditsUsed, creditLimit, subStatus } = state;

  const availablePlans = (Object.keys(PLANS) as PlanId[])
    .filter((id) => id !== "FREE") // Hide FREE from upgrade options
    .map((id) => ({
      id,
      ...PLANS[id],
    }));

  return (
    <div className="max-w-6xl mx-auto p-8 space-y-12 flex justify-center h-screen flex-col">
      <header className="space-y-4">
        <h1 className="text-4xl font-bold tracking-tight text-foreground">
          Billing & Usage
        </h1>
        <p className="text-muted-foreground text-lg">
          Manage your subscription and monitor your account limits.
        </p>
      </header>

      {/* Current Usage Section */}
      <section className="bg-card border rounded-3xl p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="space-y-2">
            <UsageBar used={creditsUsed} limit={creditLimit} />
            <p className="text-sm text-muted-foreground">
              {creditLimit === -1
                ? `${creditsUsed.toLocaleString()} credits used (Unlimited)`
                : `${creditsUsed.toLocaleString()} / ${creditLimit.toLocaleString()} credits used this period`}
            </p>
          </div>

          <div className="flex items-center gap-4 bg-muted/50 px-6 py-4 rounded-xl border">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Current Plan
              </p>
              <h3 className="text-2xl font-bold text-primary">{currentPlan}</h3>
            </div>
            <div
              className={`px-3 py-1 rounded-full text-xs font-medium ${
                subStatus === "ACTIVE"
                  ? "bg-emerald-500/10 text-emerald-500"
                  : "bg-red-500/10 text-red-500"
              }`}
            >
              {subStatus}
            </div>
          </div>
        </div>
      </section>

      {/* Upgrade Options */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {availablePlans.map((plan) => (
          <BillingCard
            key={plan.id}
            plan={plan}
            isCurrent={plan.id === currentPlan && subStatus === "ACTIVE"}
          />
        ))}
      </section>

      <footer className="text-center pt-8">
        <p className="text-sm text-muted-foreground">
          Questions? Contact{" "}
          <a
            href="mailto:support@dmbroo.com"
            className="text-primary hover:underline"
          >
            support@dmbroo.com
          </a>
        </p>
      </footer>
    </div>
  );
}
