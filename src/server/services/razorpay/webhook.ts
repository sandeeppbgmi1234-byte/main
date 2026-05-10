import { WebhookPayloadSchema } from "./schemas";

import type {
  PaymentAuthorizedEvent,
  PaymentCapturedEvent,
  PaymentFailedEvent,
  OrderPaidEvent,
  SubscriptionAuthenticatedEvent,
  SubscriptionActivatedEvent,
  SubscriptionChargedEvent,
  SubscriptionUpdatedEvent,
  SubscriptionStatusChangeEvent,
} from "./types";
import { verifyHmacSignature } from "./utils";
import { razorpayConfig } from "./config.server";
import { prisma } from "@/server/db";
import {
  activateSubscription,
  renewSubscription,
  expireSubscription,
  changePlan,
} from "../billing";
import { getInternalPlanIdByRazorpayId } from "@/configs/plans.config";

// --- Per-event handlers (Stub implementations) ---

async function onPaymentAuthorized(
  event: PaymentAuthorizedEvent,
): Promise<void> {
  const { entity } = event.payload.payment;
  console.info(`[Razorpay] Payment authorized: ${entity.id}`);
}

async function onPaymentCaptured(event: PaymentCapturedEvent): Promise<void> {
  const { entity } = event.payload.payment;
  console.info(
    `[Razorpay] Payment captured: ${entity.id} for order ${entity.order_id}`,
  );
}

async function onPaymentFailed(event: PaymentFailedEvent): Promise<void> {
  const { entity } = event.payload.payment;
  console.warn(`[Razorpay] Payment failed: ${entity.id}`, event.payload.error);
}

async function onOrderPaid(event: OrderPaidEvent): Promise<void> {
  const { entity: order } = event.payload.order;
  console.info(`[Razorpay] Order paid: ${order.id}`);
}

async function onSubscriptionAuthenticated(
  event: SubscriptionAuthenticatedEvent,
): Promise<void> {
  const { entity: sub } = event.payload.subscription;
  console.info(`[Razorpay] Subscription authenticated: ${sub.id}`);
}

async function onSubscriptionActivated(
  event: SubscriptionActivatedEvent,
): Promise<void> {
  const { entity: sub } = event.payload.subscription;
  const userId = sub.notes?.clerkUserId;
  if (!userId) {
    throw new Error(
      `[Razorpay] No userId in activated subscription notes for ${sub.id}`,
    );
  }

  const planId = getInternalPlanIdByRazorpayId(sub.plan_id);
  if (!planId) {
    throw new Error(`[Razorpay] Unknown Razorpay plan_id: ${sub.plan_id}`);
  }

  await activateSubscription(userId, planId, sub.id, sub.plan_id);
}

async function onSubscriptionCharged(
  event: SubscriptionChargedEvent,
): Promise<void> {
  const { entity: sub } = event.payload.subscription;
  const { entity: payment } = event.payload.payment;
  const userId = sub.notes?.clerkUserId;
  if (!userId) {
    throw new Error(
      `[Razorpay] No userId in charged subscription notes for ${sub.id}`,
    );
  }

  const planId = getInternalPlanIdByRazorpayId(sub.plan_id);
  if (!planId) {
    throw new Error(
      `[Razorpay] Unknown Razorpay plan_id in charged: ${sub.plan_id}`,
    );
  }

  const method = payment.method;
  let detail: string | undefined;

  if (method === "upi") {
    detail = payment.vpa;
  } else if (method === "card") {
    detail = payment.card?.last4
      ? `**** **** **** ${payment.card.last4}`
      : undefined;
  }

  await renewSubscription(userId, planId, {
    paymentId: payment.id,
    amount: payment.amount,
    method,
    detail,
  });
}

async function onSubscriptionUpdated(
  event: SubscriptionUpdatedEvent,
): Promise<void> {
  const { entity: sub } = event.payload.subscription;
  const userId = sub.notes?.clerkUserId;
  if (!userId) {
    throw new Error(
      `[Razorpay] No userId in updated subscription notes for ${sub.id}`,
    );
  }

  const planId = getInternalPlanIdByRazorpayId(sub.plan_id);
  if (!planId) {
    throw new Error(
      `[Razorpay] Unknown Razorpay plan_id in updated: ${sub.plan_id}`,
    );
  }

  const { prisma } = await import("@/server/db");
  const existingSub = await prisma.subscription.findFirst({
    where: { user: { clerkId: userId } },
    select: { plan: true },
  });

  if (existingSub && existingSub.plan === planId) {
    console.info(`[Razorpay] Plan unchanged for ${userId}, skipping changePlan`);
    return;
  }

  // Handle plan change (upgrade/downgrade)
  await changePlan(userId, planId, sub.id, sub.plan_id);
}

async function onSubscriptionStatusChange(
  event: SubscriptionStatusChangeEvent,
): Promise<void> {
  const { entity: sub } = event.payload.subscription;
  const userId = sub.notes?.clerkUserId;
  if (!userId) {
    throw new Error(
      `[Razorpay] No userId in ${event.event} subscription notes for ${sub.id}`,
    );
  }

  switch (event.event) {
    case "subscription.paused":
    case "subscription.halted":
    case "subscription.cancelled":
    case "subscription.completed":
      await expireSubscription(userId);
      break;
    case "subscription.resumed":
      // Re-activate if it was paused
      // Note: Full re-activation happens on next successful charge or manually here
      console.info(`[Razorpay] Subscription resumed for ${userId}`);
      break;
    case "subscription.pending":
      console.info(`[Razorpay] Subscription pending for ${userId}`);
      break;
  }
}

/**
 * Handles incoming Razorpay webhook events.
 * Verify signature → Validate payload → Dispatch to handlers.
 */
export async function handleWebhookEvent(
  rawBody: string,
  signature: string,
  headers?: { get: (key: string) => string | null },
): Promise<void> {
  // 1. Verify signature
  verifyHmacSignature(rawBody, signature, razorpayConfig.webhookSecret);

  // 2. Parse payload
  let rawJson;
  try {
    rawJson = JSON.parse(rawBody);
  } catch (err) {
    console.warn("[Razorpay] Invalid JSON payload.");
    return;
  }

  // Idempotency: Attempt to claim the event atomically
  // Fallback to x-razorpay-event-id header if payload id is missing
  const razorpayEventId = rawJson.id || headers?.get("x-razorpay-event-id");
  if (!razorpayEventId) {
    console.warn(
      "[Razorpay Webhook] Payload missing 'id' for deduplication. Processing as non-idempotent.",
    );
  } else {
    try {
      await prisma.processedWebhookEvent.create({
        data: { razorpayEventId },
      });
      console.info(`[Razorpay] Atomically claimed event ${razorpayEventId}`);
    } catch (err: any) {
      if (err.code === "P2002") {
        console.info(
          `[Razorpay] Event ${razorpayEventId} already processed, skipping.`,
        );
        return;
      }
      throw err; // Re-throw other errors to trigger webhook retry
    }
  }

  const parsed = WebhookPayloadSchema.safeParse(rawJson);
  if (!parsed.success) {
    const eventName = rawJson.event || "unknown";
    console.error(
      `[Razorpay] Validation failed for supported event: ${eventName}`,
    );
    console.error("[Razorpay Validation Error]:", parsed.error.format());
    console.debug("[Razorpay Raw Payload]:", JSON.stringify(rawJson, null, 2));

    console.warn(
      "[Razorpay] Unrecognised webhook event branch or invalid payload.",
    );
    return;
  }

  // 3. Dispatch

  const event = parsed.data;

  switch (event.event) {
    case "payment.authorized":
      await onPaymentAuthorized(event);
      break;
    case "payment.captured":
      await onPaymentCaptured(event);
      break;
    case "payment.failed":
      await onPaymentFailed(event);
      break;
    case "order.paid":
      await onOrderPaid(event);
      break;
    case "subscription.authenticated":
      await onSubscriptionAuthenticated(event);
      break;
    case "subscription.activated":
      await onSubscriptionActivated(event);
      break;
    case "subscription.charged":
      await onSubscriptionCharged(event);
      break;
    case "subscription.updated":
      await onSubscriptionUpdated(event);
      break;
    case "subscription.pending":
    case "subscription.halted":
    case "subscription.cancelled":
    case "subscription.completed":
    case "subscription.paused":
    case "subscription.resumed":
      await onSubscriptionStatusChange(event);
      break;
  }
}
