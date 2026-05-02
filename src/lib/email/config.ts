/**
 * Centralized email configuration for constants, visual identity, and environment vars.
 */

const isProduction = process.env.NODE_ENV === "production";
const appUrl = process.env.APP_URL;
const fromEmail = process.env.RESEND_FROM_EMAIL;

export const IS_PRODUCTION = isProduction;

// Enforce required environment variables in production to prevent silent failures
if (isProduction) {
  if (!appUrl) {
    throw new Error(
      "PRODUCTION_CONFIG_ERROR: 'APP_URL' must be defined in production environment.",
    );
  }
  if (!fromEmail) {
    throw new Error(
      "PRODUCTION_CONFIG_ERROR: 'RESEND_FROM_EMAIL' must be defined in production environment.",
    );
  }
}

// Define branding colors and URLs to keep templates clean and consistent
export const EMAIL_CONFIG = {
  // Use professional colors for consistent branding across templates
  COLORS: {
    PRIMARY: "#2563eb", // Blue 600
    DANGER: "#dc2626", // Red 600
    SLATE: {
      50: "#f8fafc",
      200: "#e2e8f0",
      600: "#475569",
      800: "#1e293b",
      900: "#0f172a",
    },
  },

  // Application metadata for email context
  APP: {
    NAME: "Dmbroo",
    URL: appUrl || "http://localhost:3000",
    FROM: fromEmail || "Dmbroo <onboarding@dmbroo.com>",
  },

  // Metadata for emails (timeouts, limits etc)
  LIMITS: {
    MAX_ATTACHMENTS: 5,
    RETRY_COUNT: 3,
  },
} as const;
