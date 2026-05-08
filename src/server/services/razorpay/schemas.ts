import { z } from "zod";

// --- Inputs ---

export const CreateOrderSchema = z.object({
  amountInRupees: z.number().positive("Amount must be positive"),
  currency: z.enum(["INR"]).default("INR"),
  receipt: z.string().max(40).optional(),
  notes: z
    .record(z.string(), z.union([z.string(), z.number(), z.null()]))
    .optional(),
});

export const VerifyPaymentSchema = z.object({
  razorpay_order_id: z.string().min(1),
  razorpay_payment_id: z.string().min(1),
  razorpay_signature: z.string().min(1),
});

// --- Webhook event payloads ---

const PaymentEntitySchema = z.object({
  id: z.string(),
  order_id: z.string().optional(), // order_id might be missing in some subscription events
  amount: z.number(),
  currency: z.string(),
  status: z.string(),
  method: z.string().optional(),
  vpa: z.string().optional(),
  card: z
    .object({
      last4: z.string().optional(),
      network: z.string().optional(),
    })
    .optional(),
  email: z.string().optional(),
  contact: z.string().optional(),
  created_at: z.number().optional(),
});

const PaymentCapturedSchema = z.object({
  payment: z.object({ entity: PaymentEntitySchema }),
});

const PaymentFailedSchema = z.object({
  payment: z.object({ entity: PaymentEntitySchema }),
  error: z.object({
    code: z.string(),
    description: z.string(),
    reason: z.string().optional(),
  }),
});

const OrderPaidSchema = z.object({
  order: z.object({
    entity: z.object({
      id: z.string(),
      amount: z.number(),
      status: z.string(),
    }),
  }),
  payment: z.object({ entity: PaymentEntitySchema }),
});

const BaseWebhookSchema = z.object({
  id: z.string().optional(),
  entity: z.literal("event").optional(),
  account_id: z.string().optional(),
  contains: z.array(z.string()).optional(),
  created_at: z.number().optional(),
});

const SubscriptionEntitySchema = z.object({
  id: z.string(),
  notes: z.record(z.string(), z.string()).optional(),
});

export const WebhookPayloadSchema = z.discriminatedUnion("event", [
  BaseWebhookSchema.extend({
    event: z.literal("payment.authorized"),
    payload: z.object({ payment: z.object({ entity: PaymentEntitySchema }) }),
  }),
  BaseWebhookSchema.extend({
    event: z.literal("payment.captured"),
    payload: PaymentCapturedSchema,
  }),
  BaseWebhookSchema.extend({
    event: z.literal("payment.failed"),
    payload: PaymentFailedSchema,
  }),
  BaseWebhookSchema.extend({
    event: z.literal("order.paid"),
    payload: OrderPaidSchema,
  }),
  // --- Subscription events ---
  BaseWebhookSchema.extend({
    event: z.literal("subscription.authenticated"),
    payload: z.object({
      subscription: z.object({
        entity: z.object({
          id: z.string(),
          plan_id: z.string(),
          status: z.string(),
          notes: z.record(z.string(), z.string()).optional(),
        }),
      }),
      payment: z.object({ entity: PaymentEntitySchema }).optional(),
    }),
  }),
  BaseWebhookSchema.extend({
    event: z.literal("subscription.activated"),
    payload: z.object({
      subscription: z.object({
        entity: z.object({
          id: z.string(),
          plan_id: z.string(),
          status: z.string(),
          customer_id: z.string().optional(),
          total_count: z.number().optional(),
          paid_count: z.number().optional(),
          current_start: z.number().optional(),
          current_end: z.number().optional(),
          start_at: z.number().optional(),
          end_at: z.number().optional(),
          auth_attempts: z.number().optional(),
          notes: z.record(z.string(), z.string()).optional(),
        }),
      }),
    }),
  }),
  BaseWebhookSchema.extend({
    event: z.literal("subscription.charged"),
    payload: z.object({
      subscription: z.object({
        entity: z.object({
          id: z.string(),
          plan_id: z.string(),
          status: z.string().optional(),
          total_count: z.number().optional(),
          paid_count: z.number().optional(),
          notes: z.record(z.string(), z.string()).optional(),
        }),
      }),
      payment: z.object({
        entity: PaymentEntitySchema,
      }),
    }),
  }),
  BaseWebhookSchema.extend({
    event: z.literal("subscription.updated"),
    payload: z.object({
      subscription: z.object({
        entity: z.object({
          id: z.string(),
          plan_id: z.string(),
          status: z.string(),
          notes: z.record(z.string(), z.string()).optional(),
        }),
      }),
    }),
  }),
  BaseWebhookSchema.extend({
    event: z.enum([
      "subscription.pending",
      "subscription.halted",
      "subscription.cancelled",
      "subscription.completed",
      "subscription.paused",
      "subscription.resumed",
    ]),
    payload: z.object({
      subscription: z.object({ entity: SubscriptionEntitySchema }),
    }),
  }),
]);
