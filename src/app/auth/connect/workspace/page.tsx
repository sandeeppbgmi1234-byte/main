import Image from "next/image";
import React from "react";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { Instagram, ArrowRight } from "lucide-react";
import GirlImage from "@/assets/stock-images/connect-page-girl.png";
import { getUserWorkspaces, selectWorkspace } from "../actions";
import { instagramOAuthAction } from "@/api/services/instagram/actions";
import { getFeatureGates } from "@/server/services/billing/feature-gates";
import { prisma } from "@/server/db";
import { getEffectiveMaxAccounts } from "@/configs/plans.config";

/**
 * WorkspacePage allows users to switch between multiple connected Instagram accounts.
 * It is only accessible if the user's plan allows multiple accounts.
 */
const WorkspacePage = async () => {
  const { userId: clerkId } = await auth();
  if (!clerkId) redirect("/sign-in");

  // Fetch user data and connected accounts in parallel
  const [user, accounts] = await Promise.all([
    prisma.user.findUnique({
      where: { clerkId },
      select: { id: true, createdAt: true },
    }),
    getUserWorkspaces(),
  ]);

  if (!user) redirect("/sign-in");

  // Check feature gates to ensure multi-account access is allowed
  const featureGates = await getFeatureGates(clerkId);
  const planId = featureGates.state.currentPlan;
  const maxAccounts = getEffectiveMaxAccounts(user.createdAt, planId);

  // Redirect to billings if the current plan only supports a single account
  if (maxAccounts <= 1) {
    redirect("/dash/billing");
  }

  const atLimit = accounts.length >= maxAccounts;

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F1F1F1] p-4">
      <div className="w-full max-w-5xl flex flex-col md:flex-row animate-fade-in gap-4 relative">
        {/* Left Side - Selection Form */}
        <div className="bg-white rounded-lg p-12 w-full md:w-[55%] flex flex-col justify-center transition-all duration-500 z-10 relative">
          <div className="max-w-md mx-auto w-full space-y-8">
            {/* Branding */}
            <div className="text-center animation-delay-100 animate-fade-in">
              <h1 className="text-2xl font-medium text-[#6A06E4]">DmBroo</h1>
            </div>

            <div className="space-y-2 text-center animation-delay-200 animate-fade-in">
              <h2 className="text-2xl font-semibold text-gray-900">
                Select Workspace
              </h2>
              <p className="text-gray-500 text-sm">
                Choose the instagram account you want to manage
              </p>
            </div>

            {/* Account List */}
            <div className="space-y-4 animation-delay-300 animate-fade-in">
              {accounts.map((account) => {
                const isTokenExpired =
                  new Date(account.tokenExpiresAt) < new Date();
                const isInactive = !account.isActive;
                const needsReauth = isTokenExpired || isInactive;

                return (
                  <form
                    key={account.id}
                    action={
                      needsReauth
                        ? instagramOAuthAction
                        : selectWorkspace.bind(null, account.id)
                    }
                  >
                    <button
                      type="submit"
                      className="w-full flex items-center p-4 bg-gray-50 hover:bg-gray-100 rounded-2xl transition-all duration-300 group cursor-pointer border border-transparent hover:border-gray-200"
                    >
                      <div className="relative h-12 w-12 rounded-full overflow-hidden mr-4 ring-2 ring-white">
                        {account.profilePictureUrl ? (
                          <Image
                            src={account.profilePictureUrl}
                            alt={account.username}
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        ) : (
                          <div className="h-full w-full bg-gray-200 flex items-center justify-center">
                            <Instagram className="h-6 w-6 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 text-left">
                        <p className="font-semibold text-gray-900">
                          {account.username}
                        </p>
                        {needsReauth && (
                          <p className="text-[10px] text-red-500 font-medium">
                            {isTokenExpired
                              ? "⚠️ Connection lost"
                              : "Deactivated"}
                          </p>
                        )}
                      </div>
                      <div className="h-10 w-10 bg-[#0F172A] rounded-full flex items-center justify-center group-hover:scale-105 transition-transform">
                        <ArrowRight className="h-5 w-5 text-white" />
                      </div>
                    </button>
                  </form>
                );
              })}

              {/* Add Account Option */}
              {!atLimit && (
                <form
                  action={instagramOAuthAction}
                  className="text-center pt-2"
                >
                  <button
                    type="submit"
                    className="text-[14px] text-[#6A06E4] font-semibold hover:opacity-80 transition-opacity cursor-pointer"
                  >
                    + Add another account
                  </button>
                </form>
              )}
            </div>

            {/* Legal Notice */}
            <p className="text-[10px] text-center text-gray-400 animation-delay-500 animate-fade-in leading-5 pt-4">
              By proceeding you acknowledge that you have read, understood and
              agree to our Terms and Conditions.
            </p>
          </div>
        </div>

        {/* Right Side - Visual Asset */}
        <div className="hidden md:block md:w-[45%] relative min-h-[500px] animation-delay-200 animate-fade-in z-50">
          {/* Orange Background Box */}
          <div className="absolute inset-0 bg-[#F5A623] rounded-lg w-3/4" />

          {/* Girl Image - Popping out */}
          <div className="absolute inset-0 -left-20 bottom-0 flex items-end justify-center z-20">
            <div className="relative w-full h-full -left-20">
              <Image
                src={GirlImage}
                alt="Welcome"
                fill
                className="object-contain object-bottom drop-shadow-2xl"
                priority
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkspacePage;
