import { auth } from "@clerk/nextjs/server";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/server/db";
import { WORKSPACE_CONFIG } from "@/configs/workspace.config";
import { CONNECT_ROUTE } from "@/configs/routes.config";
import { disconnectAccount } from "@/server/services/instagram/oauth.service";
import { ApiRouteError } from "@/server/middleware/errors/classes";

/**
 * Workspace Service
 * Centralized logic for multi-workspace management.
 */
export const workspaceService = {
  /**
   * Retrieves the current workspace ID from cookies
   */
  async getActiveId(): Promise<string | undefined> {
    const cookieStore = await cookies();
    return cookieStore.get(WORKSPACE_CONFIG.ACTIVE_WORKSPACE_COOKIE)?.value;
  },

  /**
   * Verifies if a workspace belongs to the user and is active
   */
  async verifyOwnership(instaAccountId: string, clerkId: string) {
    return prisma.instaAccount.findFirst({
      where: {
        id: instaAccountId,
        user: { clerkId },
        isActive: true,
      },
      select: { id: true, username: true },
    });
  },

  /**
   * Gets the verified active workspace for the current session.
   * Redirects to /connect if no accounts or invalid session.
    It checks their Cookie to see which Instagram account they used last.
    If the cookie is missing (new browser), it looks in the DB for any account where isActive: true.
  */
  async getVerifiedActiveWorkspace() {
    const { userId } = await auth();
    if (!userId) {
      redirect("/auth");
    }

    const activeId = await this.getActiveId();

    const userWithAccounts = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: {
        subscription: {
          select: { status: true },
        },
        instaAccounts: {
          where: { isActive: true },
          orderBy: { connectedAt: "asc" },
          select: {
            id: true,
            username: true,
            profilePictureUrl: true,
            tokenExpiresAt: true,
          },
        },
      },
    });

    const activeAccounts = userWithAccounts?.instaAccounts || [];

    // 1. Force connect if no accounts
    if (activeAccounts.length === 0) {
      redirect(CONNECT_ROUTE);
    }

    // 2. Validate current cookie session
    const currentAccount = activeAccounts.find((acc) => acc.id === activeId);

    if (currentAccount) {
      // --- HARD-STOP: Token Expiration Check ---
      const now = new Date();
      if (
        currentAccount.tokenExpiresAt &&
        currentAccount.tokenExpiresAt < now
      ) {
        redirect(CONNECT_ROUTE);
      }

      return {
        id: currentAccount.id,
        username: currentAccount.username,
        allAccounts: activeAccounts,
        subscriptionStatus: userWithAccounts?.subscription?.status ?? "ACTIVE",
      };
    }

    // 3. Stale or Missing Session: Auto-initialize to first valid account
    // Filter out expired accounts from candidates
    const validCandidates = activeAccounts.filter(
      (acc) => !acc.tokenExpiresAt || acc.tokenExpiresAt > new Date()
    );

    if (validCandidates.length === 0) {
      redirect(CONNECT_ROUTE);
    }

    const defaultAccount = validCandidates[0];

    // Preserve the deep link for redirection after workspace callback
    const headerStore = await headers();
    const currentUrl = headerStore.get("x-url") || "/dash";
    const encodedNext = encodeURIComponent(currentUrl);

    redirect(
      `/auth/callback/workspace?id=${defaultAccount.id}&next=${encodedNext}`,
    );
  },

  /**
   * Resolves the verified dashboard context (auth + workspace).
   * Returns { clerkId, instaAccountId, workspace }
   * Use this in server pages to avoid scattered guard logic.
   */
  async getVerifiedContext() {
    const { userId } = await auth();
    if (!userId) {
      redirect("/auth");
    }

    const workspace = await this.getVerifiedActiveWorkspace();

    return {
      clerkId: userId,
      instaAccountId: workspace.id,
      workspace,
    };
  },

  /**
   * Sets the active workspace cookie and revalidates
   */
  async setActive(id: string) {
    const { userId } = await auth();
    if (!userId) redirect("/auth");

    const account = await this.verifyOwnership(id, userId);
    if (!account) throw new Error("Invalid workspace or access denied");

    const cookieStore = await cookies();
    cookieStore.set(WORKSPACE_CONFIG.ACTIVE_WORKSPACE_COOKIE, id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: WORKSPACE_CONFIG.COOKIE_MAX_AGE_SECONDS,
      path: "/",
    });

    const { revalidatePath } = await import("next/cache");
    revalidatePath("/", "layout");

    return id;
  },

  /**
   * Resets the active workspace by clearing its cookie
   */
  async clearActiveWorkspaceCookie() {
    const cookieStore = await cookies();
    cookieStore.delete(WORKSPACE_CONFIG.ACTIVE_WORKSPACE_COOKIE);
  },

  /**
   * Performs soft-disconnection of a workspace
   */
  async disconnect(id: string) {
    const { userId } = await auth();
    if (!userId) redirect("/auth");

    const account = await this.verifyOwnership(id, userId);
    if (!account) {
      throw new ApiRouteError(
        "Account not found or access denied.",
        "NOT_FOUND",
        404,
      );
    }

    // Database update must succeed before we clear any local session state
    await disconnectAccount(id, userId);

    // Refresh the router cache and layouts before we potentially redirect
    const { revalidatePath } = await import("next/cache");
    revalidatePath("/", "layout");

    const cookieStore = await cookies();
    const activeId = cookieStore.get(
      WORKSPACE_CONFIG.ACTIVE_WORKSPACE_COOKIE,
    )?.value;

    // If we disconnected the currently active workspace, clear the cookie and redirect
    if (activeId === id) {
      cookieStore.delete(WORKSPACE_CONFIG.ACTIVE_WORKSPACE_COOKIE);
      redirect(CONNECT_ROUTE);
    }
  },

  /**
   * Fetches all Instagram accounts for the current user
   */
  async getUserWorkspaces() {
    const { userId: clerkId } = await auth();
    if (!clerkId) return [];

    const user = await prisma.user.findUnique({
      where: { clerkId },
      select: {
        instaAccounts: {
          orderBy: { connectedAt: "asc" },
          select: {
            id: true,
            username: true,
            profilePictureUrl: true,
            isActive: true,
            tokenExpiresAt: true,
          },
        },
      },
    });

    return user?.instaAccounts ?? [];
  },
};
