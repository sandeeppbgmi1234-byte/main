import { z } from "zod";

/**
 * Validates and exports Razorpay environment variables.
 * Fails loudly at module load time if keys are missing.
 */
const EnvSchema = z.object({
  RAZORPAY_KEY_ID: z.string().min(1, "RAZORPAY_KEY_ID is required"),
  RAZORPAY_KEY_SECRET: z.string().min(1, "RAZORPAY_KEY_SECRET is required"),
  RAZORPAY_WEBHOOK_SECRET: z
    .string()
    .min(1, "RAZORPAY_WEBHOOK_SECRET is required"),
});

// Parse process.env - will throw if invalid
const env = EnvSchema.parse(process.env);

export const razorpayConfig = {
  keyId: env.RAZORPAY_KEY_ID,
  keySecret: env.RAZORPAY_KEY_SECRET,
  webhookSecret: env.RAZORPAY_WEBHOOK_SECRET,
} as const;
