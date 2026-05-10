import { APP_CONFIG } from "@/configs/app.config";

/**
 * Validates the Origin header against allowed origins
 * Returns true if origin is valid or missing (for same-origin requests)
 */
export function validateOrigin(origin: string | null): {
  valid: boolean;
  error?: string;
} {
  // Allows requests without Origin header (same-origin, GET requests, etc.)
  if (!origin) {
    return { valid: true };
  }

  const allowedOrigin = APP_CONFIG.ORIGIN;

  try {
    const originUrl = new URL(origin);
    const originHost = originUrl.origin;

    // Validates exact match against allowed origin (canonicalized scheme/host/port)
    if (originHost === allowedOrigin) {
      return { valid: true };
    }
  } catch (error) {
    return {
      valid: false,
      error: "Invalid origin header format",
    };
  }

  // Allows ngrok and similar development tunnels in dev mode
  if (process.env.NODE_ENV === "development") {
    const originHost = origin.replace(/^https?:\/\//, "").split("/")[0];
    if (originHost.includes("ngrok")) {
      return { valid: true };
    }
  }

  return {
    valid: false,
    error: "Invalid request origin",
  };
}

/**
 * Validates the Referer header against allowed origins
 */
export function validateReferer(referer: string | null): {
  valid: boolean;
  error?: string;
} {
  // Allows requests without Referer header
  if (!referer) {
    return { valid: true };
  }

  try {
    const refererUrl = new URL(referer);
    const allowedOrigin = APP_CONFIG.ORIGIN;
    const refererHost = refererUrl.origin;

    // Validates host matches allowed origin
    if (refererHost === allowedOrigin) {
      return { valid: true };
    }

    // Allows ngrok and similar development tunnels
    if (
      process.env.NODE_ENV === "development" &&
      refererHost.includes("ngrok")
    ) {
      return { valid: true };
    }

    return {
      valid: false,
      error: "Invalid request referer",
    };
  } catch (error) {
    // Invalid URL format
    return {
      valid: false,
      error: "Invalid referer format",
    };
  }
}

/**
 * Validates CSRF protection for state-changing requests
 * Checks Origin and Referer headers
 */
export function validateCsrfProtection(request: Request): {
  valid: boolean;
  error?: string;
} {
  const method = request.method;

  // Only validates state-changing methods
  if (!["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
    return { valid: true };
  }

  // Skips validation for webhook and compliance endpoints (they have their own signature validation)
  const url = new URL(request.url);
  if (
    url.pathname === "/api/instagram/deauthorize" ||
    url.pathname === "/api/instagram/data-deletion" ||
    url.pathname.includes("/webhooks/")
  ) {
    return { valid: true };
  }

  // Validates Origin header first (preferred)
  const origin = request.headers.get("origin");
  const originValidation = validateOrigin(origin);

  if (originValidation.valid) {
    return { valid: true };
  }

  // Falls back to Referer validation if Origin is missing
  if (!origin) {
    const referer = request.headers.get("referer");
    return validateReferer(referer);
  }

  // Origin is present but invalid
  return originValidation;
}
