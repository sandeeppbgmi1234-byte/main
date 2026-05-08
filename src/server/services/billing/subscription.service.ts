import { prisma } from "@/server/db";
import { PLANS, type PlanId, getEffectiveMaxAccounts } from "@/configs/plans.config";
import { syncCreditStateToRedis } from "@/server/redis/operations/billing";

import { logger } from "@/server/utils/pino";
import { getRazorpayClient } from "../razorpay/client";
import { sendEmail } from "@/lib/email";
import { Prisma } from "@prisma/client";

// 28-day billing cycle (BullMQ week × 4 in Razorpay)
const BILLING_CYCLE_DAYS = 28;

/**
 * Resolves a Clerk user ID to the internal MongoDB User ID.
 */
async function resolveInternalUserId(clerkUserId: string): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { clerkId: clerkUserId },
    select: { id: true },
  });

  if (!user) {
    throw new Error(`User with Clerk ID ${clerkUserId} not found in database`);
  }

  return user.id;
}

export function getPeriodEnd(start: Date): Date {
  const end = new Date(start);
  end.setDate(end.getDate() + BILLING_CYCLE_DAYS);
  return end;
}

/**
 * Provisions or activates a subscription for a user.
 * Used on first signup (FREE) and after a successful Razorpay payment.
 */
export async function activateSubscription(
  clerkUserId: string,
  planId: PlanId,
  razorpaySubscriptionId: string | null = null,
  razorpayPlanId: string | null = null,
): Promise<void> {
  const userId = await resolveInternalUserId(clerkUserId);
  const plan = PLANS[planId];
  const periodStart = new Date();
  const periodEnd = getPeriodEnd(periodStart);

  // Enforce account/feature constraints immediately
  const constraintOps = await getPlanConstraintOps(userId, planId);

  // Upsert Subscription and CreditLedger in a transaction
  await prisma.$transaction([
    prisma.subscription.upsert({
      where: { userId },
      create: {
        userId,
        plan: planId,
        status: "ACTIVE",
        razorpaySubscriptionId,
        razorpayPlanId,
        currentPeriodStart: periodStart,
        currentPeriodEnd: periodEnd,
      },
      update: {
        plan: planId,
        status: "ACTIVE",
        razorpaySubscriptionId,
        razorpayPlanId,
        currentPeriodStart: periodStart,
        currentPeriodEnd: periodEnd,
      },
    }),
    prisma.creditLedger.upsert({
      where: { userId },
      create: {
        userId,
        creditsUsed: 0,
        creditLimit: plan.creditLimit,
        periodStart,
        periodEnd,
        quotaEmailSentAt: null,
      },
      update: {
        creditsUsed: 0,
        creditLimit: plan.creditLimit,
        periodStart,
        periodEnd,
        quotaEmailSentAt: null,
      },
    }),
    ...constraintOps,
  ]);

  // Sync fresh state to Redis immediately
  await syncCreditStateToRedis(clerkUserId, 0, plan.creditLimit, "ACTIVE");

  // Send first invoice/onboarding confirmation
  const user = await prisma.user.findUnique({
    where: { clerkId: clerkUserId },
  });

  if (
    user &&
    user.email &&
    razorpaySubscriptionId &&
    process.env.NODE_ENV === "production"
  ) {
    sendEmail({
      type: "invoice",
      to: user.email,
      name: user.fullName || "there",
      invoiceNumber: `INV-${razorpaySubscriptionId}`,
      amount: plan.priceInRupees,
      currency: "INR",
      dueDate: new Date().toLocaleDateString(),
      paymentUrl: `${process.env.APP_URL}/dash/billing`,
    }).catch((err) => {
      logger.error({ clerkUserId, err: err.message }, "Activation mail failed");
    });
  }

  logger.info({ clerkUserId, planId }, "Subscription activated");
}

/**
 * Resets credits at the start of a new billing cycle (subscription.charged).
 * Does NOT change the plan — only resets usage and period dates.
 */
export async function renewSubscription(
  clerkUserId: string,
  planId: PlanId,
  paymentData?: {
    paymentId: string;
    amount: number;
    method?: string;
    detail?: string;
  },
): Promise<void> {
  const userId = await resolveInternalUserId(clerkUserId);
  const plan = PLANS[planId];
  const periodStart = new Date();
  const periodEnd = getPeriodEnd(periodStart);

  // Check for plan changes during renewal
  const constraintOps = await getPlanConstraintOps(userId, planId);

  const operations: Prisma.PrismaPromise<unknown>[] = [
    prisma.subscription.update({
      where: { userId },
      data: {
        plan: planId,
        status: "ACTIVE",
        currentPeriodStart: periodStart,
        currentPeriodEnd: periodEnd,
        paymentMethod: paymentData?.method,
        paymentDetail: paymentData?.detail,
      },
    }),
    prisma.creditLedger.update({
      where: { userId },
      data: {
        creditsUsed: 0,
        creditLimit: plan.creditLimit,
        periodStart,
        periodEnd,
        quotaEmailSentAt: null,
      },
    }),
    ...constraintOps,
  ];

  if (paymentData) {
    // Use upsert to handle webhook retries gracefully (idempotency)
    operations.push(
      prisma.invoice.upsert({
        where: { invoiceId: paymentData.paymentId },
        create: {
          userId,
          invoiceId: paymentData.paymentId,
          amount: paymentData.amount,
          status: "paid",
          method: paymentData.method,
          detail: paymentData.detail,
        },
        update: {
          status: "paid",
          amount: paymentData.amount,
          method: paymentData.method,
          detail: paymentData.detail,
        },
      }),
    );
  }

  await prisma.$transaction(operations);

  await syncCreditStateToRedis(clerkUserId, 0, plan.creditLimit, "ACTIVE");

  if (paymentData && process.env.NODE_ENV === "production") {
    const user = await prisma.user.findUnique({
      where: { clerkId: clerkUserId },
    });

    if (user && user.email) {
      sendEmail({
        type: "invoice",
        to: user.email,
        name: user.fullName || "there",
        invoiceNumber: `INV-${paymentData.paymentId}`,
        amount: paymentData.amount / 100, // Paise to Rupees
        currency: "INR",
        dueDate: new Date().toLocaleDateString(),
        paymentUrl: `${process.env.APP_URL}/dash/billing`,
      }).catch((err) => {
        logger.error({ clerkUserId, err: err.message }, "Invoice mail failed");
      });
    }
  }

  logger.info({ clerkUserId, planId }, "Subscription renewed — credits reset");
}

/**
 * Expires a subscription (on cancellation, halt, or completion).
 * Downgrades the user to the FREE plan limits immediately.
 */
export async function expireSubscription(clerkUserId: string): Promise<void> {
  const userId = await resolveInternalUserId(clerkUserId);
  const freePlan = PLANS.FREE;

  const ops: Prisma.PrismaPromise<any>[] = [
    prisma.subscription.update({
      where: { userId },
      data: { status: "EXPIRED" },
    }),
    prisma.creditLedger.update({
      where: { userId },
      data: {
        creditLimit: freePlan.creditLimit,
      },
    }),
    prisma.instaAccount.updateMany({
      where: { userId, accountRole: "SECONDARY" },
      data: { isActive: false },
    }),
    prisma.automation.updateMany({
      where: {
        instaAccount: { userId, accountRole: "SECONDARY" },
      },
      data: { status: "PLAN_PAUSED" },
    }),
    prisma.form.updateMany({
      where: {
        instaAccount: { userId, accountRole: "SECONDARY" },
      },
      data: { status: "DRAFT" },
    }),
  ];

  if (!freePlan.hasAskToFollow) {
    ops.push(
      prisma.automation.updateMany({
        where: {
          user: { id: userId },
          askToFollowEnabled: true,
        },
        data: { askToFollowEnabled: false },
      })
    );
  }

  const [_, ledger] = await prisma.$transaction(ops);

  await syncCreditStateToRedis(
    clerkUserId,
    ledger.creditsUsed,
    freePlan.creditLimit,
    "EXPIRED",
  );

  try {
    const { notificationsQueue } = await import("@/server/redis/queues");
    await notificationsQueue.add("plan-expired", { type: "PLAN_EXPIRED", userId: clerkUserId });
  } catch (err) {
    logger.error({ clerkUserId, err }, "Failed to enqueue plan-expired notification");
  }

  logger.info(
    { clerkUserId },
    "Subscription expired — downgraded to FREE limits",
  );
}

/**
 * Changes a user's plan mid-cycle (upgrade or downgrade).
 * Updates limit in DB and Redis immediately.
 */
export async function changePlan(
  clerkUserId: string,
  newPlanId: PlanId,
  razorpaySubscriptionId: string | null = null,
  razorpayPlanId: string | null = null,
): Promise<void> {
  const constraintOps = await getPlanConstraintOps(userId, newPlanId);

  const ops: Prisma.PrismaPromise<any>[] = [
    prisma.creditLedger.update({
      where: { userId },
      data: { creditLimit: newPlan.creditLimit },
    }),
    prisma.subscription.update({
      where: { userId },
      data: {
        plan: newPlanId,
        status: "ACTIVE",
        razorpaySubscriptionId,
        razorpayPlanId,
      },
    }),
    ...constraintOps,
  ];

  const [ledger] = await prisma.$transaction(ops);

  await syncCreditStateToRedis(
    clerkUserId,
    ledger.creditsUsed,
    newPlan.creditLimit,
    "ACTIVE",
  );

  logger.info({ clerkUserId, newPlanId }, "Plan changed");
}

/**
 * Creates a Razorpay Subscription session and returns the checkout URL.
 */
export async function createCheckoutSession(
  userId: string,
  planId: PlanId,
): Promise<{ checkoutUrl: string }> {
  const plan = PLANS[planId];
  if (!plan.razorpayPlanId) {
    throw new Error(`Plan ${planId} has no associated Razorpay plan ID`);
  }

  const client = getRazorpayClient();

  try {
    const subscription = await client.subscriptions.create({
      plan_id: plan.razorpayPlanId,
      total_count: 12, // 1 year of weekly-style blocks (4 weeks each)
      quantity: 1,
      customer_notify: process.env.NODE_ENV === "production" ? 1 : 0,
      notes: {
        clerkUserId: userId,
      },
    });

    if (!subscription.short_url) {
      throw new Error("Razorpay did not return a checkout URL");
    }

    return { checkoutUrl: subscription.short_url };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error(
      { userId, planId, err: message },
      "Failed to create Razorpay subscription",
    );
    throw new Error("Failed to initialize payment session. Please try again.");
  }
}

/**
 * Fetches the user's current subscription and credit details.
 */
export async function getUserBillingData(clerkUserId: string) {
  const userId = await resolveInternalUserId(clerkUserId);

  const [subscription, ledger, invoices] = await prisma.$transaction([
    prisma.subscription.findUnique({
      where: { userId },
      select: {
        plan: true,
        status: true,
        currentPeriodStart: true,
        currentPeriodEnd: true,
        paymentMethod: true,
        paymentDetail: true,
      },
    }),
    prisma.creditLedger.findUnique({
      where: { userId },
      select: {
        creditsUsed: true,
        creditLimit: true,
        periodStart: true,
        periodEnd: true,
      },
    }),
    prisma.invoice.findMany({
      where: { userId },
      select: {
        invoiceId: true,
        status: true,
        amount: true,
        date: true,
      },
      orderBy: { date: "desc" },
      take: 5,
    }),
  ]);

  return {
    subscription,
    ledger,
    invoices: invoices.map((inv) => {
      const validStatuses = ["paid", "failed", "pending"];
      const status = validStatuses.includes(inv.status)
        ? (inv.status as "paid" | "failed" | "pending")
        : "pending";

      return {
        id: inv.invoiceId,
        status,
        amount: inv.amount,
        date: inv.date,
      };
    }),
  };
}
/**
 * Internal helper to generate Prisma operations for plan constraints.
 * Handles account deactivation, automation pausing, and form stopping.
 */
async function getPlanConstraintOps(userId: string, newPlanId: PlanId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      createdAt: true,
      subscription: { select: { plan: true } },
    },
  });

  const currentPlanId = user?.subscription?.plan as PlanId | undefined;
  const currentPlan = currentPlanId ? PLANS[currentPlanId] : PLANS.FREE;

  const maxAllowed = getEffectiveMaxAccounts(
    user?.createdAt || new Date(),
    newPlanId,
  );
  const isDowngradingAccounts = maxAllowed === 1 && currentPlan.maxAccounts > 1;

  const ops: Prisma.PrismaPromise<any>[] = [];

  if (isDowngradingAccounts) {
    // Downgrading to single-account plan: Deactivate SECONDARY accounts and stop their content
    ops.push(
      prisma.instaAccount.updateMany({
        where: { userId, accountRole: "SECONDARY" },
        data: { isActive: false },
      }),
      prisma.automation.updateMany({
        where: { instaAccount: { userId, accountRole: "SECONDARY" } },
        data: { status: "PLAN_PAUSED" },
      }),
      prisma.form.updateMany({
        where: { instaAccount: { userId, accountRole: "SECONDARY" } },
        data: { status: "DRAFT" },
      }),
    );
  } else if (newPlanId === "BLACK") {
    // Upgrading to multi-account plan: Reactivate SECONDARY accounts
    ops.push(
      prisma.instaAccount.updateMany({
        where: { userId, accountRole: "SECONDARY" },
        data: { isActive: true },
      }),
      prisma.automation.updateMany({
        where: {
          instaAccount: { userId, accountRole: "SECONDARY" },
          status: "PLAN_PAUSED",
        },
        data: { status: "ACTIVE" },
      }),
      // Note: We don't auto-publish forms as they might have been drafts by choice
    );
  }

  // Handle feature gates (e.g. Ask to Follow)
  if (!PLANS[newPlanId].hasAskToFollow) {
    ops.push(
      prisma.automation.updateMany({
        where: { user: { id: userId }, askToFollowEnabled: true },
        data: { askToFollowEnabled: false },
      }),
    );
  }

  return ops;
}
