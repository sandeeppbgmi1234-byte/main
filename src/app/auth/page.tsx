"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import GirlImage from "@/assets/stock-images/Group 248@2x.png";
import GoogleButton from "./_components/GoogleButton";
import { useSignIn, useSignUp } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

type AuthMode = "login" | "signup";
type AuthStep = "input" | "verify";

/**
 * AuthPage Component
 * Handles unified authentication (Login and Sign Up) via Clerk.
 * Addresses the "verification strategy" error by correctly routing to useSignIn or useSignUp.
 */
const AuthPage = () => {
  const {
    isLoaded: isSignInLoaded,
    signIn,
    setActive: setSignInActive,
  } = useSignIn();
  const {
    isLoaded: isSignUpLoaded,
    signUp,
    setActive: setSignUpActive,
  } = useSignUp();

  const [mode, setMode] = useState<AuthMode>("login");
  const [step, setStep] = useState<AuthStep>("input");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(15);
  const [canResend, setCanResend] = useState(false);
  const router = useRouter();

  // Reset step when switching modes
  useEffect(() => {
    setStep("input");
    setTimeLeft(15);
    setCanResend(false);
  }, [mode]);

  // Timer logic for OTP resend
  useEffect(() => {
    if (step === "verify" && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0) {
      setCanResend(true);
    }
  }, [step, timeLeft]);

  const handleResend = async () => {
    if (!canResend || !isSignUpLoaded) return;
    setIsLoading(true);
    try {
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setTimeLeft(15);
      setCanResend(false);
      toast.success("Verification code resent!");
    } catch (err: any) {
      toast.error(err.errors?.[0]?.message || "Failed to resend code");
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handles the primary action (Login or Sign Up)
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSignInLoaded || !isSignUpLoaded) return;

    if (!email || !password) {
      toast.error("Please enter both email and password");
      return;
    }

    setIsLoading(true);

    try {
      if (mode === "login") {
        const result = await signIn.create({
          identifier: email,
          password,
        });

        if (result.status === "complete") {
          await setSignInActive({ session: result.createdSessionId });
          router.push("/auth/connect");
        } else {
          toast.info(
            "Additional steps required. Please use Google login or check your email.",
          );
        }
      } else {
        // Sign Up Flow
        await signUp.create({
          emailAddress: email,
          password,
        });

        // Send verification email
        await signUp.prepareEmailAddressVerification({
          strategy: "email_code",
        });

        setStep("verify");
        toast.success("Verification code sent to your email!");
      }
    } catch (err: any) {
      const errorMessage =
        err.errors?.[0]?.longMessage ||
        err.errors?.[0]?.message ||
        "Authentication failed";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handles email verification for new accounts
   */
  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSignUpLoaded || !code) return;

    setIsLoading(true);

    try {
      const result = await signUp.attemptEmailAddressVerification({ code });

      if (result.status === "complete") {
        await setSignUpActive({ session: result.createdSessionId });
        router.push("/auth/connect");
      } else {
        toast.error("Verification failed. Please try again.");
      }
    } catch (err: any) {
      toast.error(err.errors?.[0]?.message || "Verification failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F1F1F1] p-4">
      <div className="w-full max-w-5xl overflow-hidden flex flex-col md:flex-row animate-fade-in gap-8">
        {/* Left Side - Auth Form */}
        <div className="bg-white rounded-lg p-12 w-full md:w-[50%] flex flex-col justify-center transition-all duration-500">
          <div className="max-w-md mx-auto w-full space-y-8">
            {/* Branding */}
            <div className="text-center animation-delay-100 animate-fade-in">
              <h1 className="text-2xl font-medium text-[#6A06E4]">DmBroo</h1>
            </div>

            {step === "input" ? (
              <>
                {/* Header */}
                <div className="text-center space-y-2 animation-delay-200 animate-fade-in">
                  <h2 className="text-lg font-bold text-gray-900">
                    {mode === "login" ? "Log In" : "Create Account"}
                  </h2>
                  <p className="text-gray-600">
                    {mode === "login"
                      ? "Welcome back to DmBroo!"
                      : "Join DmBroo today!"}
                  </p>
                </div>

                {/* OAuth Options */}
                <GoogleButton />

                {/* Divider */}
                <div className="relative animation-delay-300 animate-fade-in">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-white text-gray-500">or</span>
                  </div>
                </div>

                {/* Main Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-2 animation-delay-500 animate-fade-in">
                      {/* <label
                        htmlFor="email"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Email ID
                      </label> */}
                      <input
                        type="email"
                        id="email"
                        autoComplete="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-purple-500 outline-none transition-all duration-300"
                      />
                    </div>

                    <div className="space-y-2 animation-delay-500 animate-fade-in">
                      {/* <label
                        htmlFor="password"
                        id="password-label"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Password
                      </label> */}
                      <input
                        type="password"
                        id="password"
                        autoComplete={
                          mode === "login" ? "current-password" : "new-password"
                        }
                        placeholder={
                          mode === "login"
                            ? "Enter your password"
                            : "Create a password"
                        }
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-purple-500 outline-none transition-all duration-300"
                      />
                    </div>
                  </div>

                  <div className="animation-delay-500 animate-fade-in">
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full bg-[#6A06E4] text-white font-semibold py-2.5 rounded-lg transform  hover:opacity-80 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-70"
                    >
                      {isLoading && (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      )}
                      {mode === "login" ? "Log In" : "Register"}
                    </button>
                  </div>
                </form>

                {/* Footer Links */}
                <p className="text-center text-gray-600 animation-delay-500 animate-fade-in">
                  {mode === "login"
                    ? "Don't have an account?"
                    : "Already have an account?"}{" "}
                  <button
                    onClick={() =>
                      setMode(mode === "login" ? "signup" : "login")
                    }
                    className="text-purple-600 font-semibold hover:text-purple-700 transition-colors"
                  >
                    {mode === "login" ? "Register" : "Log In"}
                  </button>
                </p>
              </>
            ) : (
              /* Verification Step */
              <div className="space-y-12 animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="text-center space-y-2">
                  <h2 className="text-lg font-bold text-gray-900">
                    OTP Sent Successfully!
                  </h2>
                  <p className="text-gray-500 text-sm">
                    OTP has been sent on <br />
                    <span className="text-gray-600 font-medium">{email}</span>
                  </p>
                </div>

                <form onSubmit={handleVerify} className="space-y-4">
                  <div className="space-y-4 text-center">
                    <label
                      htmlFor="code"
                      className="block text-sm font-medium text-gray-600"
                    >
                      Enter 6-Digit OTP
                    </label>
                    <input
                      type="text"
                      id="code"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      pattern="[0-9]*"
                      placeholder="OTP"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      maxLength={6}
                      required
                      className="w-full px-4 py-3 bg-[#F9F9F9] border-none rounded-lg focus:ring-1 focus:ring-purple-500 outline-none transition-all duration-300 text-center text-lg tracking-[0.5em] text-gray-400 font-medium placeholder:tracking-normal"
                    />
                  </div>

                  <div className="space-y-4">
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full bg-[#6A06E4] text-white font-semibold py-3 rounded-lg hover:opacity-90 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-70"
                    >
                      {isLoading && (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      )}
                      Continue
                    </button>

                    <div className="text-center text-sm">
                      <span className="text-gray-500">
                        {timeLeft > 0
                          ? `00:${timeLeft.toString().padStart(2, "0")}`
                          : ""}
                      </span>{" "}
                      <button
                        type="button"
                        onClick={handleResend}
                        disabled={!canResend || isLoading}
                        className={`font-medium transition-colors ${
                          canResend
                            ? "text-red-500 hover:underline"
                            : "text-gray-400 cursor-not-allowed"
                        }`}
                      >
                        Resend OTP
                      </button>
                    </div>
                  </div>
                </form>

                <p className="text-center text-sm text-gray-600">
                  Want to change the Email?{" "}
                  <button
                    onClick={() => setStep("input")}
                    className="text-[#6A06E4] font-semibold hover:underline transition-colors"
                  >
                    Back
                  </button>
                </p>
              </div>
            )}

            {/* Legal Notice */}
            <p className="text-xs text-center text-gray-500 animation-delay-500 animate-fade-in leading-5">
              By proceeding you acknowledge that you have read, understood and
              agree to our Terms and Conditions.
            </p>
          </div>
        </div>

        {/* Right Side - Visual Asset */}
        <div className="hidden md:block md:w-[50%] relative rounded-lg bg-[#88769c] h-inherit animation-delay-200 animate-fade-in min-h-[500px]">
          <div className="absolute right-32 w-full h-full max-w-md -bottom-[10%]">
            <Image
              src={GirlImage}
              alt="Welcome"
              fill
              className="object-contain"
              priority
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
