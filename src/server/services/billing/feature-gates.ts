import { prisma } from "@/server/db";
import {
  PLANS,
  type PlanId,
  getEffectiveMaxAccounts,
} from "@/configs/plans.config";
import { syncCreditStateToRedis } from "@/server/redis/operations/billing";

import { type FeatureGates } from "@/server/services/billing/types";

/**
 * Returns the current feature access and credit state for a user.
 * Parameters: clerkUserId (Clerk ID)
 * Prefers Redis for speed; falls back to MongoDB if cache is cold.
 */
export async function getFeatureGates(
  clerkUserId: string,
): Promise<FeatureGates> {
  const user = await prisma.user.findUnique({
    where: { clerkId: clerkUserId },
    select: { id: true, createdAt: true },
  });

  if (!user) {
    throw new Error(`User with Clerk ID ${clerkUserId} not found`);
  }

  const userId = user.id;

  // Resolve subscription and credit ledger from DB (Authoritative for UI)
  const [subscription, ledger] = await Promise.all([
    prisma.subscription.findUnique({ where: { userId } }),
    prisma.creditLedger.findUnique({ where: { userId } }),
  ]);

  // Default to ACTIVE FREE if no subscription record exists
  const planId: PlanId = (subscription?.plan as PlanId) ?? "FREE";
  const subStatus = subscription?.status ?? "ACTIVE";
  const plan = PLANS[planId];

  const maxAccounts = getEffectiveMaxAccounts(user.createdAt, planId);

  // Source credits directly from the ledger to match actual billed usage
  const creditsUsed = ledger?.creditsUsed ?? 0;
  const creditLimit = ledger?.creditLimit ?? plan.creditLimit;

  // Background: Keep Redis in sync (Heal cache if drift occurred)
  // We don't await this to keep the API response snappy
  syncCreditStateToRedis(
    clerkUserId,
    creditsUsed,
    creditLimit,
    subStatus,
  ).catch(() => {});

  // Count active Instagram accounts to enforce multi-account gate
  const activeAccountCount = await prisma.instaAccount.count({
    where: { userId, isActive: true },
  });

  return {
    state: {
      currentPlan: planId,
      creditsUsed,
      creditLimit,
      subStatus,
      maxForms: plan.maxForms,
    },
    access: {
      canAddAccount: activeAccountCount < maxAccounts && subStatus === "ACTIVE",
      hasLeadGen: plan.hasLeadGen && subStatus === "ACTIVE",
      canCreateForms: plan.hasLeadGen && subStatus === "ACTIVE",
      hasAskToFollow: plan.hasAskToFollow && subStatus === "ACTIVE",
      hasBestPerformer: plan.hasBestPerformer && subStatus === "ACTIVE",
    },
  };
}
