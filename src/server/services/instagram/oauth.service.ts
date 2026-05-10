/**
 * OAuth Service
 * Business logic for Instagram OAuth flow — no Clerk metadata dependency
 */

import { sendEmail } from "@/lib/email";
import {
  generateAuthorizationUrl,
  fetchInstagramUserData,
  validateInstagramAccount,
} from "@/server/instagram/oauth/oauth";
import {
  INSTAGRAM_OAUTH,
  ERROR_MESSAGES,
  validateOAuthConfig,
} from "@/server/config/instagram.config";
import {
  subscribeToWebhooks,
  markWebhooksEnabled,
} from "@/server/instagram/webhook/registration";
import {
  PLANS,
  type PlanId,
  PlanIdSchema,
  getEffectiveMaxAccounts,
} from "@/configs/plans.config";

import { getPeriodEnd } from "../billing/subscription.service";
import { syncCreditStateToRedis } from "@/server/redis/operations/billing";

import { refreshAccessToken as refreshToken } from "@/server/instagram/token-manager";
import { encrypt } from "@/server/utils/encryption";
import { clogger } from "@/server/utils/consola";
import { deactivateInstaAccount } from "@/server/repository/instagram/insta-account.repository";
import { validateSecureState } from "@/server/instagram/oauth/oauth-state";
import {
  exchangeCodeForToken,
  calculateTokenExpiration,
  getLongLivedToken,
} from "@/server/instagram/token-manager";
import { ApiRouteError } from "@/server/middleware/errors/classes";
import type { OAuthState } from "@dm-broo/common-types";
import {
  setUserConnected,
  invalidateUser,
} from "@/server/redis/operations/user";
import { cacheAccessTokenR } from "@/server/redis/operations/token";
import { createClerkClient } from "@clerk/nextjs/server";
import { prisma } from "@/server/db";

/**
 * Initiates the OAuth flow by generating authorization URL
 * @param clerkId - The Clerk ID of the user
 * @param returnUrl - The URL to redirect to after the OAuth flow
 * @returns The authorization URL
 */
export async function initiateOAuth({
  clerkId,
  returnUrl,
}: OAuthState): Promise<string> {
  // Validates OAuth configuration
  if (!validateOAuthConfig())
    throw new ApiRouteError(
      ERROR_MESSAGES.AUTH.NO_ACCESS_TOKEN,
      "AUTH_NO_ACCESS_TOKEN",
      500,
    );

  // Generates authorization URL with state
  const authUrl = generateAuthorizationUrl({
    clerkId,
    returnUrl: returnUrl || "/dash",
  });

  return authUrl;
}

/**
 * Handles the OAuth callback from Instagram
 * Uses Instagram Login - no Facebook Pages required
 * @param code - The code from the OAuth callback
 * @param state - The secure state from the OAuth callback
 * @returns The OAuth callback result with the return URL, username, and account type
 */
export async function handleOAuthCallback(code: string, state: string) {
  try {
    // Decodes and validates state
    const { clerkId, returnUrl } = validateSecureState(state);

    // Fetch user directly from Clerk using their known ID
    const clerkClient = createClerkClient({
      secretKey: process.env.CLERK_SECRET_KEY,
    });
    const currentClerkUser = await clerkClient.users.getUser(clerkId);

    // Exchanges code for short-lived token (returns user_id too)
    console.log("Exchanging code for short-lived token...");
    const shortLivedToken = await exchangeCodeForToken(code);

    // Exchanges for long-lived token (60 days)
    console.log("Exchanging for long-lived token...");
    const longLivedToken = await getLongLivedToken(
      shortLivedToken.access_token,
    );

    // Fetches Instagram user data using the token
    console.log("Fetching Instagram user data...");
    const instagramUser = await fetchInstagramUserData(
      longLivedToken.access_token,
    );

    console.log(
      "Instagram user data fetched successfully:",
      instagramUser.username,
    );

    // Validates account type (must be BUSINESS or MEDIA_CREATOR)
    const validation = validateInstagramAccount(instagramUser);

    if (!validation.valid) {
      throw new ApiRouteError(
        validation.error || ERROR_MESSAGES.AUTH.INVALID_ACCOUNT_TYPE,
      );
    }

    // Calculates token expiration
    const tokenExpiresAt = calculateTokenExpiration(longLivedToken.expires_in);
    const grantedScopes = INSTAGRAM_OAUTH.SCOPES.split(",");

    // Wraps user creation and Instagram account linking in a transaction
    const { executeTransaction } =
      await import("@/server/repository/repository-utils");

    const { user, instaAccount, userCreated, currentPlan } =
      await executeTransaction(
        async (tx) => {
          // Finds or creates the platform user record
          let user = await tx.user.findUnique({ where: { clerkId } });
          let userCreated = false;

          if (!user) {
            const plan = PLANS.FREE;
            const periodStart = new Date();
            const periodEnd = getPeriodEnd(periodStart);

            user = await tx.user.create({
              data: {
                clerkId,
                fullName: instagramUser.username,
                email: currentClerkUser?.primaryEmailAddress?.emailAddress,
                imageUrl: instagramUser.profile_picture_url,
                // Initialize FREE subscription and ledger
                subscription: {
                  create: {
                    plan: "FREE",
                    status: "ACTIVE",
                    currentPeriodStart: periodStart,
                    currentPeriodEnd: periodEnd,
                  },
                },
                creditLedger: {
                  create: {
                    creditsUsed: 0,
                    creditLimit: plan.creditLimit,
                    periodStart,
                    periodEnd,
                    quotaEmailSentAt: null,
                    quotaEmailSendingAt: null,
                  },
                },
              },
              include: { subscription: true },
            });

            userCreated = true;
          } else {
            // Refresh user with subscription for limit check
            user = await tx.user.findUniqueOrThrow({
              where: { id: user.id },
              include: { subscription: true },
            });
          }

          const instagramUserIdString = String(instagramUser.id);

          // Pre-flight: ensure this IG account isn't already claimed by another user
          const existingAccount = await tx.instaAccount.findUnique({
            where: { instagramUserId: instagramUserIdString },
            select: { id: true, userId: true, isActive: true, accountRole: true },
          });

          if (existingAccount && existingAccount.userId !== user.id) {
            throw new ApiRouteError(
              "This Instagram account is already connected to another Dmbroo account.",
              "IG_ACCOUNT_ALREADY_CLAIMED",
              409,
            );
          }

          // Count active connections only
          const activeAccountCount = await tx.instaAccount.count({
            where: { userId: user.id, isActive: true },
          });

          // Count total connections to determine role
          const totalAccountCount = await tx.instaAccount.count({
            where: { userId: user.id },
          });
          const accountRole = existingAccount ? existingAccount.accountRole : (totalAccountCount === 0 ? "PRIMARY" : "SECONDARY");

          const planValidation = PlanIdSchema.safeParse(
            user.subscription?.plan,
          );
          const currentPlan: PlanId = planValidation.success
            ? planValidation.data
            : "FREE";

          const maxAllowed = getEffectiveMaxAccounts(
            user.createdAt,
            currentPlan,
          );

          // Capacity Check: Required for both new connections AND reactivation of inactive rows
          const isReactivating = existingAccount && !existingAccount.isActive;
          const isNewConnection = !existingAccount;

          if (
            (isNewConnection || isReactivating) &&
            activeAccountCount >= maxAllowed
          ) {
            throw new ApiRouteError(
              `Your ${currentPlan} plan allows a maximum of ${maxAllowed} connected accounts. Please upgrade to add more.`,
              "ACCOUNT_LIMIT_REACHED",
              403,
            );
          }

          const accountPayload = {
            instagramUserId: instagramUserIdString,
            username: instagramUser.username,
            accountType: instagramUser.account_type,
            webhookUserId: instagramUser.user_id,
            profilePictureUrl: instagramUser.profile_picture_url,
            biography: instagramUser.biography,
            followersCount: instagramUser.followers_count,
            followsCount: instagramUser.follows_count,
            mediaCount: instagramUser.media_count,
            accessToken: encrypt(longLivedToken.access_token),
            refreshToken: null as null,
            tokenExpiresAt,
            grantedScopes,
            webhooksEnabled: false,
            isActive: true,
            accountRole,
          };

          // If it's a reconnect of an existing account, update in place; otherwise create a new workspace
          let instaAccount;
          if (existingAccount) {
            instaAccount = await tx.instaAccount.update({
              where: { id: existingAccount.id },
              data: accountPayload,
            });
          } else {
            instaAccount = await tx.instaAccount.create({
              data: { userId: user.id, ...accountPayload },
            });
          }

          // Baseline follower snapshot for the day
          const nowUtc = new Date();
          const todayUtc = new Date(
            Date.UTC(
              nowUtc.getUTCFullYear(),
              nowUtc.getUTCMonth(),
              nowUtc.getUTCDate(),
            ),
          );

          const existingSnapshot = await tx.instaFollowerSnapshot.findUnique({
            where: {
              instaAccountId_date: {
                instaAccountId: instaAccount.id,
                date: todayUtc,
              },
            },
          });

          if (!existingSnapshot) {
            await tx.instaFollowerSnapshot.create({
              data: {
                instaAccountId: instaAccount.id,
                followersCount: instagramUser.followers_count || 0,
                date: todayUtc,
              },
            });
          }

          return { user, instaAccount, userCreated, currentPlan };
        },
        { operation: "handleOAuthCallback", models: ["User", "InstaAccount"] },
      );

    // Background sync to Redis after successful transaction commit
    const plan = PLANS[currentPlan] || PLANS.FREE;
    if (userCreated) {
      syncCreditStateToRedis(clerkId, 0, plan.creditLimit, "ACTIVE").catch(
        (err) => clogger.error("Failed to sync new user billing state:", err),
      );
    }

    // Register webhooks (non-fatal)
    try {
      const webhookRegistered = await subscribeToWebhooks(
        longLivedToken.access_token,
        instagramUser.id,
      );
      if (webhookRegistered) {
        await markWebhooksEnabled(instaAccount.id, true);
      }
    } catch {
      // Non-fatal: user can still use the app without webhooks
    }

    // Populate Redis so the worker instantly knows this workspace is live
    await setUserConnected(instagramUser.user_id);
    await cacheAccessTokenR(
      clerkId,
      instagramUser.user_id,
      longLivedToken.access_token,
    );

    // Trigger onboarding email only for the first connected account
    if (userCreated && user.email) {
      // Use fire-and-forget approach or awaited call depending on preference.
      // Given it's production-ready, we await but catch errors to prevent killing the callback redirect.
      sendEmail({
        type: "onboarding",
        to: user.email,
        name: currentClerkUser.firstName || user.fullName || "there",
      }).catch((err) => {
        // Log failure but don't disrupt the user's flow
        clogger.error("Failed to send onboarding email:", err.message);
      });
    }

    return {
      returnUrl: returnUrl || "/dash",
      instaAccountId: instaAccount.id,
      username: instagramUser.username,
      accountType: instagramUser.account_type,
    };
  } catch (error) {
    throw error;
  }
}

// Refreshes the access token for a specific Instagram workspace — now verified by clerkId
export async function refreshAccessToken(
  instaAccountId: string,
  clerkId: string,
) {
  const account = await prisma.instaAccount.findFirst({
    where: { id: instaAccountId, user: { clerkId }, isActive: true },
    select: {
      id: true,
      accessToken: true,
      refreshToken: true,
      tokenExpiresAt: true,
      webhookUserId: true,
      instagramUserId: true,
    },
  });

  if (!account) {
    throw new Error(ERROR_MESSAGES.AUTH.NO_INSTAGRAM_ACCOUNT);
  }

  const { accessToken, expiresAt } = await refreshToken(account);

  // Push new token to cache so worker picks it up immediately
  const identifier = account.webhookUserId || account.instagramUserId;
  if (identifier) {
    await cacheAccessTokenR(clerkId, identifier, accessToken);
  } else {
    clogger.warn(
      { clerkId, instaAccountId },
      "[OAuthService:Refresh] No usable identifiers found for account; skipping cache update",
    );
  }

  return {
    message: "Token refreshed successfully",
    expiresAt: expiresAt.toISOString(),
  };
}

// Deactivates a specific Instagram workspace — verified by clerkId
export async function disconnectAccount(
  instaAccountId: string,
  clerkId: string,
) {
  const account = await prisma.instaAccount.findFirst({
    where: { id: instaAccountId, user: { clerkId } },
    select: {
      id: true,
      userId: true,
      instagramUserId: true,
      webhookUserId: true,
      user: { select: { id: true, clerkId: true } },
    },
  });

  if (!account) {
    throw new ApiRouteError(
      "Instagram account not found or access denied",
      "NOT_FOUND",
      404,
    );
  }

  // Soft-deactivate; keeps historical data intact
  await deactivateInstaAccount(account.id, account.user.id);

  // Flush Redis cache for this workspace only after successful DB update
  const identifier = account.webhookUserId || account.instagramUserId;
  await invalidateUser(account.user.clerkId, identifier);

  return { message: "Instagram account disconnected successfully" };
}
