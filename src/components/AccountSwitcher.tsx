"use client";

import React, { useTransition } from "react";
import Image from "next/image";
import { ChevronDown, Check } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { switchWorkspaceAction } from "@/server/workspace/actions";
import { cn } from "@/server/utils";

interface Account {
  id: string;
  username: string;
  profilePictureUrl: string | null;
}

interface AccountSwitcherProps {
  currentAccount: Account;
  allAccounts: Account[];
}

const AccountSwitcher = ({
  currentAccount,
  allAccounts,
}: AccountSwitcherProps) => {
  const [isPending, startTransition] = useTransition();

  const handleSwitch = async (accountId: string) => {
    if (accountId === currentAccount.id) return;

    startTransition(async () => {
      try {
        await switchWorkspaceAction(accountId);
        window.location.reload();
      } catch (error) {
        console.error("[AccountSwitcher] Failed to switch account:", error);
        toast.error("Failed to switch account. Please try again.");
      }
    });
  };

  // If only one account, just show the username
  if (allAccounts.length === 0) {
    return (
      <div className="flex flex-col items-center gap-0.5">
        <span className="text-[14px] font-medium text-[#1A1A1A] tracking-tight">
          @{currentAccount.username}
        </span>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6A06E4]/20 rounded-md group transition-all">
        <div className="flex items-center gap-1 cursor-pointer">
          <span className="text-[14px] font-medium text-[#1A1A1A] tracking-tight group-hover:opacity-70 transition-opacity">
            {currentAccount.username}
          </span>
          <ChevronDown
            size={14}
            className={cn(
              "text-gray-400 transition-transform duration-200",
              "group-data-[state=open]:rotate-180",
            )}
          />
        </div>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="center"
        className="w-[220px] mt-2 p-2 rounded-lg bg-[#cccccc] border-none shadow-xl animate-in fade-in zoom-in-95 duration-200"
      >
        <div className="flex flex-col gap-2">
          {allAccounts.map((account) => {
            const isActive = account.id === currentAccount.id;

            return (
              <DropdownMenuItem
                key={account.id}
                onClick={() => handleSwitch(account.id)}
                className={cn(
                  "flex items-center justify-between py-2 rounded-lg cursor-pointer transition-all duration-200 outline-none",
                  "bg-[#F9F9F9] hover:opacity-90 active:scale-[0.98]",
                  isActive && "ring-1 ring-black/5",
                )}
                disabled={isPending}
              >
                <div className="flex items-center gap-3">
                  <div className="relative w-10 h-10 rounded-full overflow-hidden shrink-0">
                    {account.profilePictureUrl ? (
                      <Image
                        src={account.profilePictureUrl}
                        alt={account.username}
                        width={40}
                        height={40}
                        className="object-cover w-full h-full"
                        unoptimized
                      />
                    ) : (
                      <div className="w-full h-full bg-[#6A06E4] flex items-center justify-center text-white font-bold text-xs uppercase">
                        {account.username.slice(0, 1)}
                      </div>
                    )}
                  </div>

                  <span className="text-[15px] font-semibold text-[#1A1A1A] tracking-tight truncate">
                    {account.username}
                  </span>
                </div>

                {isActive && (
                  <div className="w-5 h-5 rounded-full bg-[#6A06E4] flex items-center justify-center shrink-0 shadow-sm">
                    <Check size={12} strokeWidth={4} className="text-white" />
                  </div>
                )}
              </DropdownMenuItem>
            );
          })}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default AccountSwitcher;
