/**
 * Routes Configuration
 * Centralized route categories for authentication and authorization logic
 */

// Exact-match only — these routes are accessible without authentication
export const PUBLIC_ROUTES = [
  "/",
  "/auth",
  "/auth/sso-callback",
  "/api/webhooks/instagram",
  "/api/webhooks/clerk",
  "/api/webhooks/razorpay",
  "/api/instagram/deauthorize",
  "/api/instagram/data-deletion",
  "/deletion-status",
] as const;

// Prefix-match routes — these routes AND all their sub-paths are public
export const PUBLIC_PREFIX_ROUTES = ["/f"] as const;

export const AUTH_ROUTE = "/auth";
export const CONNECT_ROUTE = "/auth/connect";
export const CLAIM_ROUTE = "/auth/claim";
export const DASHBOARD_ROUTE = "/dash";

/**
 * Route Matchers
 */
export const isPublicRoute = (pathname: string) => {
  const exactMatch = (PUBLIC_ROUTES as readonly string[]).includes(pathname);
  const prefixMatch = PUBLIC_PREFIX_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
  return exactMatch || prefixMatch;
};

export const isAuthRoute = (pathname: string) => pathname === AUTH_ROUTE;
export const isConnectRoute = (pathname: string) =>
  pathname === CONNECT_ROUTE || pathname === CLAIM_ROUTE;
export const isApiRoute = (pathname: string) => pathname.startsWith("/api/");
export const isDashboardRoute = (pathname: string) =>
  pathname.startsWith(DASHBOARD_ROUTE);
