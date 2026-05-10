# Comprehensive Redis Operations Registry

This document tracks every file where Redis is modified or queried across the DmBroo ecosystem. Redis serves as our high-speed state layer to protect the primary database and respect Meta's strict API limits.

---

## 1. Main Application (Dashboard & API)
Located in: `src/server/redis/operations/`

### [Automations](file:///home/devpalwar/me/projects/dmbroo/main/src/server/redis/operations/automation.ts)
*   **Purpose**: Manages the cache for automation rules to prevent PostgreSQL hammering during comment bursts.
*   **Key Operations**:
    *   `invalidateAutomations`: Scans and deletes all automation keys for a workspace using a cursor-safe `SCAN`.
    *   `isCommentProcessedCached`: A hybrid check that uses Redis to remember if a comment was handled, falling back to the DB only on cache misses.
    *   `clearAllUserCache`: Performs a full purge of all account data when a user disconnects.

### [Billing & Credits](file:///home/devpalwar/me/projects/dmbroo/main/src/server/redis/operations/billing.ts)
*   **Purpose**: Keeps the user's "Atomic Wallet" and plan details in sync between the DB and the Worker.
*   **Key Operations**:
    *   `syncCreditStateToRedis`: The "Source of Truth" setter. Invoked after upgrades or billing resets to refresh the quota limits in Redis.

### [Instagram Data](file:///home/devpalwar/me/projects/dmbroo/main/src/server/redis/operations/instagram.ts)
*   **Purpose**: Caches Instagram posts and stories fetched from the Meta Graph API.
*   **Key Operations**:
    *   `getCachedPosts` / `getCachedStories`: Wraps native API calls with a TTL to prevent hitting Instagram's "Page Limit" errors while the user browses their dashboard.
    *   `invalidateInstagramCache`: Forces a fresh fetch when the user manually refreshes their feed.

### [Access Tokens](file:///home/devpalwar/me/projects/dmbroo/main/src/server/redis/operations/token.ts)
*   **Purpose**: Stores encrypted Long-Lived tokens.
*   **Key Operations**:
    *   `cacheAccessTokenR`: Saves the token with a 60-day TTL. Uses encryption before storage for security.

### [User Connections](file:///home/devpalwar/me/projects/dmbroo/main/src/server/redis/operations/user.ts)
*   **Purpose**: Tracks the "Live" status of Instagram Workspaces.
*   **Key Operations**:
    *   `setUserConnected`: Marks an account as authorized to receive webhooks.
    *   `invalidateUser`: Removes the "Live" marker, effectively pausing all automation processing for that account.

---

## 2. Worker Service (The Engine)
Located in: `worker/src/redis/operations/`

### [Automation Engine](file:///home/devpalwar/me/projects/dmbroo/worker/src/redis/operations/automation.ts)
*   **Purpose**: The worker's high-speed rule lookup.
*   **Key Operations**:
    *   `getAutomationsByPostR` / `getAutomationsByStoryR`: Retrieves all active rules for a specific media ID. Includes a "self-healing" DB fallback if the cache is empty.

### [Idempotency & Deduplication](file:///home/devpalwar/me/projects/dmbroo/worker/src/redis/operations/comment.ts)
*   **Purpose**: Ensures one comment = one reply, no matter how many times Meta retries the webhook.
*   **Key Operations**:
    *   `isCommentProcessedR`: Uses an atomic `SET ... NX` (Set if Not Exists) to guarantee that only the first thread to touch a comment can process it.

### [Cooldowns & Throttling](file:///home/devpalwar/me/projects/dmbroo/worker/src/redis/operations/cooldown.ts)
*   **Purpose**: Manages the "Human" side of automation logic.
*   **Key Operations**:
    *   `isUserOnCooldownR`: Enforces the "One reply per 24 hours" rule for followers.
    *   `isPendingConfirmationR`: Tracks users in the "Ask to Follow" state.
    *   `isAccountSpamGuardedR`: A "Panic Mode" check that halts all replies if an account is flagged for suspicious activity.

### [Atomic Wallet](file:///home/devpalwar/me/projects/dmbroo/worker/src/redis/operations/credits.ts)
*   **Purpose**: High-concurrency credit management.
*   **Key Operations**:
    *   `reserveCreditsR`: Uses a **Lua Script** to perform an atomic "Check + Subtract" operation. This is the most critical logic in the worker to prevent users from exceeding their plan limits.

### [Event Locking](file:///home/devpalwar/me/projects/dmbroo/worker/src/redis/operations/event.ts)
*   **Purpose**: Prevents parallel processing of the same exact Webhook Event ID.
*   **Key Operations**:
    *   `acquireEventLockR`: Sets a 10-minute lock. If the server crashes mid-process, the lock expires, allowing a retry.
    *   `setEventHandledR`: Sets a 24-hour "Permanent Done" flag once a webhook is successfully finished.

### [Meta Rate Limiting](file:///home/devpalwar/me/projects/dmbroo/worker/src/redis/operations/rate-limit.ts)
*   **Purpose**: Protects the app from being banned by Meta.
*   **Key Operations**:
    *   `incrementAppUsageR`: Tracks global sliding-window usage across all users.
    *   `incrementAccountUsageR`: Tracks individual Instagram account usage to stay under the 200-calls-per-hour-per-user limit.
