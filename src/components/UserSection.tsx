import React from "react";
import Image from "next/image";
import { auth } from "@clerk/nextjs/server";
import { cookies } from "next/headers";
import { prisma } from "@/server/db";
import { WORKSPACE_CONFIG } from "@/configs/workspace.config";
import AccountSwitcher from "./AccountSwitcher";

/**
 * UserSection (Server Component)
 * Displays the currently active Instagram workspace profile in the sidebar.
 */
const UserSection = async () => {
  const { userId } = await auth();
  if (!userId) return null;

  // 1. Get the active workspace from the session cookie
  const cookieStore = await cookies();
  const activeIgId = cookieStore.get(
    WORKSPACE_CONFIG.ACTIVE_WORKSPACE_COOKIE,
  )?.value;

  if (!activeIgId) {
    return (
      <div className="flex flex-col items-center gap-3 py-4">
        <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center animate-pulse">
          <div className="w-10 h-10 rounded-full bg-gray-200" />
        </div>
        <div className="h-3 w-20 bg-gray-100 animate-pulse rounded" />
      </div>
    );
  }

  // 2. Fetch the specific account details for the sidebar
  let account;
  let allAccounts: any[] = [];
  try {
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { id: true },
    });

    if (user) {
      allAccounts = await prisma.instaAccount.findMany({
        where: {
          userId: user.id,
        },
        select: {
          id: true,
          username: true,
          profilePictureUrl: true,
          isActive: true,
        },
      });

      account = allAccounts.find((a) => a.id === activeIgId) || allAccounts[0];
    }
  } catch (error) {
    account = null;
  }

  if (!account) {
    // If the account doesn't exist, show placeholders or "Select Account"
    return (
      <div className="flex flex-col items-center gap-3 py-4 text-center">
        <div className="w-24 h-24 rounded-full bg-gray-100 border-2 border-dashed border-gray-200 flex items-center justify-center text-gray-300">
          ?
        </div>
        <span className="text-[11px] text-gray-400 font-medium">
          Select Account
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3 py-4 px-2">
      {/* Profile Image with polished gradient border */}
      <div className="relative w-28 h-28 rounded-full p-[3px] bg-linear-to-br from-[#6A06E4] via-purple-300 to-blue-200">
        <div className="w-full h-full rounded-full overflow-hidden bg-white ring-2 ring-white">
          {account.profilePictureUrl ? (
            <Image
              src={account.profilePictureUrl}
              alt={account.username}
              width={112}
              height={112}
              className="rounded-full object-cover w-full h-full"
              unoptimized
            />
          ) : (
            <div className="w-full h-full rounded-full bg-[#6A06E4] flex items-center justify-center text-white uppercase font-bold text-2xl">
              {account.username.slice(0, 1)}
            </div>
          )}
        </div>
      </div>

      {/* Account Switcher / Display name */}
      <AccountSwitcher
        currentAccount={account}
        allAccounts={allAccounts.length > 1 ? allAccounts : []}
      />
    </div>
  );
};

export default UserSection;
