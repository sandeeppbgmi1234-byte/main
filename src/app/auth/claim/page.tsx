"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useClerk } from "@clerk/nextjs";
import { AlertCircle, Instagram, Mail, Info, ArrowRight } from "lucide-react";

/**
 * Account Claimed Page
 * Shown when a user tries to connect an IG account that is already linked to another Dmbroo user.
 */
export default function ClaimPage() {
  const router = useRouter();
  const { signOut } = useClerk();

  const handleLogoutAndRedirect = async () => {
    // Standard logout from Clerk then redirect to auth
    await signOut();
    router.push("/auth");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F1F1F1] p-4 font-sans">
      <div className="w-full max-w-xl bg-white rounded-[32px]  overflow-hidden animate-in fade-in zoom-in duration-500">
        <div className="p-8 md:p-12 space-y-8 flex flex-col items-center">
          {/* Status Icon */}
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center animate-pulse">
              <AlertCircle className="w-10 h-10 text-red-500" />
            </div>
            <div className="absolute -bottom-1 -right-1 bg-white p-1.5 rounded-full border">
              <Instagram className="w-5 h-5 text-[#E4405F]" />
            </div>
          </div>

          {/* Text Content */}
          <div className="text-center space-y-3">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 leading-tight">
              Instagram Account Already Claimed
            </h1>
            <p className="text-gray-500 max-w-md mx-auto leading-relaxed">
              This Instagram account is already connected to another Dmbroo
              workspace. You cannot link the same account to multiple emails.
            </p>
          </div>

          {/* Action Cards */}
          <div className="w-full space-y-4 pt-4">
            {/* Option 1: Login with another email */}
            <button
              onClick={handleLogoutAndRedirect}
              className="w-full group p-5 bg-white border-2 border-gray-100 rounded-2xl flex items-center text-left hover:border-purple-500 transition-all duration-300 transform hover:-translate-y-1"
            >
              <div className="w-12 h-12 rounded-lg bg-purple-50 flex items-center justify-center group-hover:bg-purple-600 transition-colors">
                <Mail className="w-6 h-6 text-purple-600 group-hover:text-white" />
              </div>
              <div className="ml-4 flex-1">
                <h3 className="font-bold text-gray-900">
                  Login with another email
                </h3>
                <p className="text-sm text-gray-500">
                  Log out and use the account that owns this IG profile.
                </p>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-purple-600 group-hover:translate-x-1 transition-all" />
            </button>

            {/* Option 2: Connect another IG account */}
            <Link
              href="/dash"
              className="w-full group p-5 bg-white border-2 border-gray-100 rounded-2xl flex items-center text-left hover:border-blue-500 transition-all duration-300 transform hover:-translate-y-1"
            >
              <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center group-hover:bg-blue-600 transition-colors">
                <Instagram className="w-6 h-6 text-blue-600 group-hover:text-white" />
              </div>
              <div className="ml-4 flex-1">
                <h3 className="font-bold text-gray-900">
                  Connect another IG account
                </h3>
                <p className="text-sm text-gray-500">
                  Stay signed in and link a different Instagram profile.
                </p>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
            </Link>
          </div>

          {/* Forgot Email Section */}
          <div className="pt-6 w-full text-center border-t border-gray-50 mt-4">
            <div className="flex items-center justify-center gap-2 text-sm text-gray-500 cursor-pointer hover:text-purple-600 transition-colors group">
              <Info className="w-4 h-4" />
              <span>Forgot which email you used?</span>
              <span className="font-semibold text-purple-600 group-hover:underline">
                Contact Support
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
