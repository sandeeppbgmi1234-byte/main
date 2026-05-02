import { Suspense } from "react";
import { currentUser } from "@clerk/nextjs/server";
import { SettingsTabNav, ProfileTab, BillingTab } from "./_components";
import { SettingsTab, ProfileData } from "./types";
import { SETTINGS_CONFIG } from "./config";
import { prisma } from "@/server/db";
import { PlanId } from "@/configs/plans.config";
import { MobileDashboardHeader } from "../_components/mobile/MobileDashboardHeader";

interface PageProps {
  searchParams: Promise<{ tab?: string }>;
}

export default async function SettingsPage({ searchParams }: PageProps) {
  const [user, queryParams] = await Promise.all([currentUser(), searchParams]);

  if (!user) return null;

  // Fetch internal user with accounts and subscription
  const internalUser = await prisma.user.findUnique({
    where: { clerkId: user.id },
    include: {
      instaAccounts: true,
      subscription: true,
    },
  });

  if (!internalUser) return null;

  const activeTab =
    (queryParams.tab as SettingsTab) || SETTINGS_CONFIG.DEFAULT_TAB;

  const profileData: ProfileData = {
    email: user.emailAddresses[0]?.emailAddress || "",
    isEmailVerified:
      user.emailAddresses[0]?.verification?.status === "verified",
    accounts: internalUser.instaAccounts.map((acc) => ({
      id: acc.id,
      username: acc.username,
      profilePictureUrl: acc.profilePictureUrl,
      accountType: acc.accountType,
      connectedAt: acc.connectedAt,
      followersCount: acc.followersCount || 0,
      isActive: acc.isActive,
      tokenExpiresAt: acc.tokenExpiresAt,
    })),
    planId: (internalUser.subscription?.plan as PlanId) || "FREE",
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "profile":
        return <ProfileTab data={profileData} />;
      case "billing":
        return (
          <Suspense
            fallback={
              <div className="flex items-center justify-center h-48">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-8 h-8 border-4 border-[#6A06E4] border-t-transparent rounded-full animate-spin" />
                  <p className="text-slate-400 text-sm font-medium animate-pulse">
                    Loading billing...
                  </p>
                </div>
              </div>
            }
          >
            <BillingTab userId={user.id} />
          </Suspense>
        );
      default:
        return <ProfileTab data={profileData} />;
    }
  };

  return (
    <div className="min-h-full w-full flex flex-col items-center md:py-8 px-4 md:px-8 gap-6 justify-center">
      {/* Mobile-only header to provide sidebar trigger */}
      <div className="md:hidden w-full">
        <MobileDashboardHeader title="Settings" showSearch={false} />
      </div>

      <div className="w-full max-w-4xl flex flex-col gap-4">
        {/* Navigation/Header Card (Desktop Only effectively, but keeping for tab switching) */}
        <div className="bg-white rounded-2xl border border-gray-200 p-4 md:p-6 flex items-center justify-between overflow-x-auto">
          <SettingsTabNav />
        </div>

        {/* Content Card */}
        <div className="bg-white rounded-2xl border border-gray-200 px-6 md:px-10 p-12">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
}
