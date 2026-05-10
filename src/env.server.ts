import { z } from "zod";

/**
 * Validates all environment variables used in the application.
 * This file is imported in next.config.ts to ensure validation at build time.
 */

const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),

  // Clerk
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1, "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is required"),
  CLERK_SECRET_KEY: z.string().min(1, "CLERK_SECRET_KEY is required"),

  // UploadThing
  UPLOADTHING_TOKEN: z.string().min(1, "UPLOADTHING_TOKEN is required"),
  UPLOADTHING_SECRET_KEY: z.string().min(1, "UPLOADTHING_SECRET_KEY is required"),

  // Upstash Redis (REST)
  UPSTASH_REDIS_REST_URL: z.string().url("UPSTASH_REDIS_REST_URL must be a valid URL"),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1, "UPSTASH_REDIS_REST_TOKEN is required"),

  // Upstash Redis (Direct)
  UPSTASH_REDIS_HOST: z.string().min(1, "UPSTASH_REDIS_HOST is required"),
  UPSTASH_REDIS_PASSWORD: z.string().min(1, "UPSTASH_REDIS_PASSWORD is required"),
  UPSTASH_REDIS_USERNAME: z.string().default("default"),

  // Queue Redis (BullMQ)
  QUEUE_REDIS_HOST: z.string().min(1, "QUEUE_REDIS_HOST is required"),
  QUEUE_REDIS_PORT: z.coerce.number().default(6379),
  QUEUE_REDIS_USERNAME: z.string().default("default"),
  QUEUE_REDIS_PASSWORD: z.string().min(1, "QUEUE_REDIS_PASSWORD is required"),

  // Encryption
  REDIS_ENCRYPTION_SECRET: z.string().min(32, "REDIS_ENCRYPTION_SECRET must be at least 32 characters"),

  // Instagram
  NEXT_PUBLIC_INSTAGRAM_API_VERSION: z.string().default("v21.0"),
  INSTAGRAM_APP_SECRET: z.string().min(1, "INSTAGRAM_APP_SECRET is required"),
  INSTAGRAM_APP_ID: z.string().min(1, "INSTAGRAM_APP_ID is required"),
  INSTAGRAM_WEBHOOK_VERIFY_TOKEN: z.string().min(1, "INSTAGRAM_WEBHOOK_VERIFY_TOKEN is required"),
  INSTAGRAM_WEBHOOK_CALLBACK_URL: z.string().url("INSTAGRAM_WEBHOOK_CALLBACK_URL must be a valid URL"),
  INSTAGRAM_REDIRECT_URI: z.string().url("INSTAGRAM_REDIRECT_URI must be a valid URL"),

  // App URLs
  NEXT_PUBLIC_APP_URL: z.string().url("NEXT_PUBLIC_APP_URL must be a valid URL"),
  APP_URL: z.string().url("APP_URL must be a valid URL").default("http://localhost:3000"),
  APP_ORIGIN: z.string().url("APP_ORIGIN must be a valid URL"),

  // Razorpay
  RAZORPAY_KEY_ID: z.string().min(1, "RAZORPAY_KEY_ID is required"),
  RAZORPAY_KEY_SECRET: z.string().min(1, "RAZORPAY_KEY_SECRET is required"),
  RAZORPAY_WEBHOOK_SECRET: z.string().min(1, "RAZORPAY_WEBHOOK_SECRET is required"),
  RAZORPAY_PLAN_ID_BASIC: z.string().min(1, "RAZORPAY_PLAN_ID_BASIC is required"),
  RAZORPAY_PLAN_ID_PREMIUM: z.string().min(1, "RAZORPAY_PLAN_ID_PREMIUM is required"),
  RAZORPAY_PLAN_ID_BLACK: z.string().min(1, "RAZORPAY_PLAN_ID_BLACK is required"),

  // Email
  RESEND_API_KEY: z.string().min(1, "RESEND_API_KEY is required"),
  RESEND_FROM_EMAIL: z.string().email("RESEND_FROM_EMAIL must be a valid email"),

  // Node Env
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
});

// Run validation
const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Invalid environment variables:", JSON.stringify(parsed.error.format(), null, 2));
  throw new Error("Invalid environment variables");
}

export const env = parsed.data;
