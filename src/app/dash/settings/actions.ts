"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/server/db";
import { purgeAllUserCaches } from "@/server/redis/operations/user";

/**
 * Server Action: Deletes the entire user account and all associated data.
 * This is a "Full Purge" and is irreversible.
 */
export async function deleteFullAccountAction() {
  const { userId: clerkId } = await auth();
  if (!clerkId) throw new Error("Unauthorized");

  // 1. Fetch user and accounts for cache purging
  const user = await prisma.user.findUnique({
    where: { clerkId },
    include: { instaAccounts: { select: { webhookUserId: true } } },
  });

  if (!user) {
    throw new Error("User not found");
  }

  const webhookUserIds = user.instaAccounts
    .map((a) => a.webhookUserId)
    .filter(Boolean) as string[];

  // 2. Perform FULL DELETION (Cascading)
  await prisma.user.delete({
    where: { clerkId },
  });

  // 3. Clear Redis Caches
  await purgeAllUserCaches(clerkId, webhookUserIds);

  // 4. Redirect to home page
  revalidatePath("/", "layout");
  redirect("/");
}
