"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, ShieldCheck, ArrowLeft } from "lucide-react";
import Link from "next/link";

function DeletionStatusContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4 selection:bg-purple-500/30">
      {/* Background Glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-600/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Card */}
        <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl overflow-hidden group">
          {/* Animated Gradient Border */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 via-transparent to-blue-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

          <div className="relative z-10 flex flex-col items-center text-center">
            {/* Icon Container */}
            <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mb-6 animate-in zoom-in duration-700">
              <CheckCircle2 className="w-10 h-10 text-green-500" />
            </div>

            <h1 className="text-2xl font-bold text-white mb-2 tracking-tight">
              Deletion Request Received
            </h1>
            <p className="text-gray-400 mb-8 leading-relaxed">
              Your request to remove all associated Instagram data from DmBroo
              has been successfully processed.
            </p>

            {/* ID Badge */}
            {id && (
              <div className="w-full bg-white/[0.05] border border-white/10 rounded-xl p-4 mb-8">
                <span className="block text-[10px] uppercase tracking-[0.2em] text-gray-500 mb-1 font-semibold">
                  Confirmation ID
                </span>
                <code className="text-sm font-mono text-purple-400 break-all">
                  {id}
                </code>
              </div>
            )}

            <div className="flex flex-col gap-4 w-full">
              <div className="flex items-center justify-center gap-2 py-3 px-4 bg-white/[0.03] border border-white/5 rounded-xl text-xs text-gray-500">
                <ShieldCheck className="w-4 h-4" />
                Your privacy is our top priority.
              </div>

              <Link
                href="/"
                className="flex items-center justify-center gap-2 w-full py-3 px-6 bg-white text-black font-semibold rounded-xl hover:bg-gray-200 transition-colors duration-200 group/btn"
              >
                <ArrowLeft className="w-4 h-4 group-hover/btn:-translate-x-1 transition-transform" />
                Return to Home
              </Link>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="mt-8 text-center text-gray-600 text-xs uppercase tracking-widest">
          © {new Date().getFullYear()} DmBroo • Safe & Secure
        </p>
      </div>
    </div>
  );
}

export default function DeletionStatusPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <DeletionStatusContent />
    </Suspense>
  );
}
