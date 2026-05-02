import type { PlanId } from "@/configs/plans.config";
import { SubscriptionStatus } from "@prisma/client";

/**
 * FeatureGates type definition
 * Used for gating features and subscription state info across both client and server contexts.
 */
export type FeatureGates = {
  state: {
    currentPlan: PlanId;
    creditsUsed: number;
    creditLimit: number;
    subStatus: SubscriptionStatus;
    maxForms: number;
  };
  access: {
    canAddAccount: boolean;
    hasLeadGen: boolean;
    canCreateForms: boolean;
    hasAskToFollow: boolean;
    hasBestPerformer: boolean;
  };
};
