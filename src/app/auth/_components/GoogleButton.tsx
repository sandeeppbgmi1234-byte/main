"use client";

import React, { useState } from "react";
import { useSignIn } from "@clerk/nextjs";
import { GoogleIcon } from "@/components/icons";

const GoogleButton = () => {
  const { signIn } = useSignIn();
  const [isClicked, setIsClicked] = useState(false);

  const handleGoogleAuth = async () => {
    if (!signIn) return;
    setIsClicked(true);
    try {
      // Start the Google OAuth flow without showing Clerk UI
      await signIn.authenticateWithRedirect({
        strategy: "oauth_google",
        redirectUrl: "/auth/sso-callback",
        redirectUrlComplete: "/auth/connect",
      });
    } catch (error) {
      console.error("Error during Google authentication:", error);
    }
  };

  return (
    <div className="animation-delay-300 animate-fade-in">
      <button
        disabled={isClicked}
        onClick={handleGoogleAuth}
        className="w-full flex items-center justify-center gap-3 px-6 py-3.5 border-2 border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-all duration-300 group"
      >
        <GoogleIcon />
        <span className="text-gray-700 font-medium group-hover:text-purple-700 transition-colors">
          {isClicked ? "Initiating..." : "Log In with Google"}
        </span>
      </button>
    </div>
  );
};

export default GoogleButton;
