import { Worker, Job } from "bullmq";
import { getQueueRedisClientR } from "@/server/redis/client";
import { KEYS } from "@/server/redis/keys";
import { prisma } from "@/server/db";
import { sendEmail } from "@/lib/email";
import { logger } from "@/server/utils/pino";
import { EMAIL_CONFIG } from "@/lib/email/config";

const redisConnection = getQueueRedisClientR();

let worker: Worker | null = null;

/**
 * Initializes and starts the BullMQ worker for notifications.
 * Processes alerts like quota-full, subscription events, etc.
 */
export function initNotificationsWorker() {
  if (worker) {
    logger.info("Notification worker already initialized, skipping.");
    return worker;
  }

  if (!redisConnection) {
    logger.warn("Notification worker skipped: No Queue Redis connection");
    return null;
  }

  worker = new Worker(
    KEYS.NOTIFICATIONS_QUEUE,
    async (job: Job) => {
      const { type, userId, usedAt } = job.data;
      logger.info(
        { type, userId, jobId: job.id },
        "Notification job received by worker",
      );

      try {
        if (type === "QUOTA_FULL") {
          await handleQuotaFullAlert(userId, usedAt);
        } else if (type === "PLAN_EXPIRED") {
          await handlePlanExpiredAlert(userId, job.data.expiredAt);
        } else if (type === "TOKEN_EXPIRED") {
          await handleTokenExpiredAlert(userId, job.data.expiredAt);
        } else {
          throw new Error(
            `Unsupported notification job type: ${type} (Job ID: ${job.id})`,
          );
        }
      } catch (err: any) {
        logger.error(
          { jobId: job.id, type, userId, error: err.message },
          "Notification job handler failed",
        );
        throw err; // Allow BullMQ retry
      }
    },
    {
      connection: redisConnection,
      concurrency: 5,
    },
  );

  worker.on("failed", (job, err) => {
    logger.error(
      { jobId: job?.id, error: err.message },
      "Notification job failed ultimately",
    );
  });

  logger.info("Notification worker initialized and listening...");
  return worker;
}

/**
 * Business logic for quota alerts.
 * Implements grace-period and idempotency check against the database.
 */
async function handleQuotaFullAlert(userId: string, usedAt: number) {
  logger.info({ userId, usedAt }, "Processing Quota Full alert...");
  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    include: { creditLedger: true },
  });

  if (!user || !user.creditLedger) {
    logger.warn({ userId }, "Quota alert skipped: User or ledger not found");
    return;
  }

  const { quotaEmailSentAt, periodStart, quotaEmailSendingAt } =
    user.creditLedger;
  const usedAtDate = new Date(usedAt);

  // 1. Period Validation: Ensure job is from the current billing period
  if (usedAtDate < periodStart) {
    logger.info(
      { userId, usedAtDate, periodStart },
      "Quota alert skipped: Event is from a previous billing period",
    );
    return;
  }

  const now = new Date();
  const FIVE_MINUTES_AGO = new Date(now.getTime() - 5 * 60 * 1000);

  logger.info(
    {
      targetUserId: user.id,
      ledgerId: user.creditLedger.id,
      periodStart: periodStart.toISOString(),
      currentSentAt: quotaEmailSentAt,
      currentSendingAt: quotaEmailSendingAt,
    },
    "Evaluating quota email claim...",
  );

  // 2. Check suppression conditions in JS — we already have the fresh data from findUnique.
  // BullMQ deduplicates quota_full jobs to a 10s window, so race risk is negligible.
  const isSentThisPeriod =
    quotaEmailSentAt !== null && quotaEmailSentAt >= periodStart;
  const isClaimInProgress =
    quotaEmailSendingAt !== null && quotaEmailSendingAt >= FIVE_MINUTES_AGO;

  if (isSentThisPeriod || isClaimInProgress) {
    logger.info(
      { userId, lastSent: quotaEmailSentAt, sendingAt: quotaEmailSendingAt },
      "Quota alert suppressed: Already sent or send in progress",
    );
    return;
  }

  // 3. Mark as "sending" using the ledger's own id — avoids Prisma MongoDB AND/OR query issues
  await prisma.creditLedger.update({
    where: { id: user.creditLedger.id },
    data: { quotaEmailSendingAt: now },
  });

  logger.info({ ledgerId: user.creditLedger.id }, "Quota email claim acquired");

  // 4. ATTEMPT SEND
  try {
    const usedAtStr = usedAtDate.toISOString();
    await sendEmail({
      type: "quota-full",
      to: user.email,
      name: user.fullName || "there",
      usedAt: usedAtStr,
      upgradeUrl: `${EMAIL_CONFIG.APP.URL}/billing`,
    });

    // 4. CONFIRM CLAIM: Set permanent record and clear sending flag
    await prisma.creditLedger.updateMany({
      where: { userId: user.id },
      data: {
        quotaEmailSentAt: now,
        quotaEmailSendingAt: null,
      },
    });

    logger.info({ userId }, "Quota full alert email sent and recorded");
  } catch (err: any) {
    // 5. ROLLBACK CLAIM: Clear sending flag on failure to allow retry
    await prisma.creditLedger.updateMany({
      where: { userId: user.id },
      data: { quotaEmailSendingAt: null },
    });

    logger.error(
      { userId, err: err.message },
      "Quota alert send failure: Claim released for retry",
    );
    throw err; // Trigger job retry
  }
}

/**
 * Business logic for plan expiration alerts.
 */
async function handlePlanExpiredAlert(clerkUserId: string, expiredAt?: number) {
  logger.info({ userId: clerkUserId }, "Processing Plan Expired alert...");
  const user = await prisma.user.findUnique({ where: { clerkId: clerkUserId } });
  
  if (!user || !user.email) {
    logger.warn({ userId: clerkUserId }, "Plan Expired alert skipped: User or email not found");
    return;
  }

  try {
    await sendEmail({
      type: "account-expired",
      to: user.email,
      name: user.fullName || "there",
      expirationDate: expiredAt ? new Date(expiredAt).toLocaleDateString() : new Date().toLocaleDateString(),
      reactivateUrl: `${EMAIL_CONFIG.APP.URL}/dash/billing`,
    });
    logger.info({ userId: clerkUserId }, "Plan expired alert email sent successfully");
  } catch (err: any) {
    logger.error(
      { userId: clerkUserId, err: err.message },
      "Plan expired alert send failure",
    );
    throw err; // Trigger job retry
  }
}

/**
 * Business logic for Instagram Token expiration alerts.
 */
async function handleTokenExpiredAlert(
  clerkUserId: string,
  expiredAt?: number,
) {
  logger.info({ userId: clerkUserId }, "Processing Token Expired alert...");
  const user = await prisma.user.findUnique({ where: { clerkId: clerkUserId } });

  if (!user || !user.email) {
    logger.warn(
      { userId: clerkUserId },
      "Token Expired alert skipped: User or email not found",
    );
    return;
  }

  try {
    await sendEmail({
      type: "token-expired",
      to: user.email,
      name: user.fullName || "there",
      expiredAt: expiredAt
        ? new Date(expiredAt).toLocaleDateString()
        : new Date().toLocaleDateString(),
      reconnectUrl: `${EMAIL_CONFIG.APP.URL}/auth/connect`,
    });
    logger.info(
      { userId: clerkUserId },
      "Token expired alert email sent successfully",
    );
  } catch (err: any) {
    logger.error(
      { userId: clerkUserId, err: err.message },
      "Token expired alert send failure",
    );
    throw err; // Trigger job retry
  }
}
