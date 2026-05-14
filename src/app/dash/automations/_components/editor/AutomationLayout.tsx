"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import phoneImg from "@/assets/png/phone.png";
import { MessageCircle, Send, AlertCircle } from "lucide-react";

type AutomationLayoutProps = {
  header: React.ReactNode;
  leftCol: React.ReactNode;
  rightCol: React.ReactNode;
  post?: { mediaUrl: string | null; mediaType: string | null } | null;
  triggerType?: string;
  isMobile?: boolean; // Mobile layout flag
};

// Placeholder shown when trigger is account-wide (Respond to All DMs)
const DMPlaceholder = () => (
  <div className="relative w-full aspect-9/16 rounded-[2.5rem] overflow-hidden border-8 border-zinc-900 bg-white flex flex-col pt-10 px-4">
    <div className="flex items-center gap-3 mb-8 px-2">
      <div className="w-10 h-10 rounded-full bg-linear-to-tr from-purple-500 to-pink-500 shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-2.5 w-24 bg-zinc-100 rounded-full" />
        <div className="h-2 w-16 bg-zinc-50 rounded-full" />
      </div>
    </div>

    <div className="space-y-4">
      <div className="self-start bg-zinc-100 rounded-xl rounded-bl-none p-4 max-w-[80%]">
        <div className="h-2 w-20 bg-zinc-200 rounded-full mb-2" />
        <div className="h-2 w-32 bg-zinc-200 rounded-full" />
      </div>
      <div className="self-end bg-purple-600 rounded-xl rounded-br-none p-4 max-w-[80%] ml-auto">
        <div className="h-2 w-24 bg-white/30 rounded-full mb-2" />
        <div className="h-2 w-16 bg-white/30 rounded-full" />
      </div>
      <div className="self-start bg-zinc-100 rounded-xl rounded-bl-none p-4 max-w-[80%]">
        <div className="h-2 w-28 bg-zinc-200 rounded-full" />
      </div>
    </div>

    <div className="mt-8 pt-8 border-t border-zinc-50">
      <div className="bg-zinc-50 rounded-full h-10 px-4 flex items-center justify-between">
        <div className="h-2 w-24 bg-zinc-200 rounded-full" />
        <Send size={14} className="text-purple-500" />
      </div>
    </div>

    <div className="absolute inset-0 bg-linear-to-b from-transparent via-white/20 to-white/60 pointer-events-none flex items-center justify-center">
      <div className="bg-white p-6 rounded-3xl flex flex-col items-center gap-3">
        <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600">
          <MessageCircle size={28} />
        </div>
        <p className="text-sm font-bold text-zinc-800">All Direct Messages</p>
      </div>
    </div>
  </div>
);

export function AutomationLayout({
  header,
  leftCol,
  rightCol,
  post,
  triggerType,
  isMobile = false,
}: AutomationLayoutProps) {
  const [mediaError, setMediaError] = useState(false);

  // Reset error state when the preview target changes
  useEffect(() => {
    setMediaError(false);
  }, [post?.mediaUrl]);

  const renderMedia = () => {
    const isNoMedia = !post || !post.mediaUrl;

    if (isNoMedia || mediaError) {
      // Account-wide DM trigger gets a special rich placeholder
      if (triggerType === "RESPOND_TO_ALL_DMS" && isNoMedia) {
        return <DMPlaceholder />;
      }

      return (
        <div className="relative w-full aspect-9/16 overflow-hidden border-8 border-zinc-900 bg-zinc-100 flex flex-col items-center justify-center p-6 text-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-zinc-200 flex items-center justify-center text-zinc-400">
            {mediaError ? (
              <AlertCircle size={24} />
            ) : (
              <MessageCircle size={24} />
            )}
          </div>
          <div className="space-y-1">
            <p className="text-xs font-bold text-zinc-800">
              Preview unavailable
            </p>
            <p className="text-[10px] text-zinc-500 leading-tight">
              Could not load the Instagram media preview.
            </p>
          </div>
          <div className="absolute inset-0 -z-10 opacity-20 grayscale pointer-events-none">
            <Image src={phoneImg} alt="" className="w-full h-auto" priority />
          </div>
        </div>
      );
    }

    // Video handles Reels and standard videos
    if (post.mediaType === "VIDEO") {
      return (
        <div className="relative w-full aspect-9/16 rounded-4xl overflow-hidden border-4 border-zinc-900 bg-black">
          <video
            src={post.mediaUrl || ""}
            autoPlay
            muted
            loop
            playsInline
            onError={() => setMediaError(true)}
            className="w-full h-full object-cover"
          />
        </div>
      );
    }

    // Static image or carousel (first frame)
    return (
      <div className="relative w-full aspect-9/16 rounded-4xl overflow-hidden border-4 border-zinc-900 bg-black">
        <Image
          src={post.mediaUrl || ""}
          alt="Post preview"
          fill
          className="object-cover"
          unoptimized
          priority
          onError={() => setMediaError(true)}
        />
      </div>
    );
  };

  return (
    <>
      <header className="flex h-auto items-center gap-2">{header}</header>

      {/* 3-column editor canvas or stacked mobile canvas */}
      <div
        className="flex-1 rounded-lg overflow-hidden shadow-inner relative"
        style={{
          backgroundColor: "#D4D4D4",
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24'%3E%3Cpath d='M12 8v8M8 12h8' stroke='%23BEBEBE' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E")`,
          backgroundRepeat: "repeat",
          backgroundSize: "24px 24px",
        }}
      >
        {isMobile ? (
          <div className="flex flex-col h-full overflow-hidden">
            {/* Phone preview stays on top */}
            <div
              className="flex justify-center p-4 shrink-0 transition-all duration-300 z-10 sticky top-0"
              style={{ height: "50vh" }}
            >
              <div className="relative h-full w-auto aspect-9/16 max-w-full flex items-start justify-center">
                {renderMedia()}
              </div>
            </div>
            {/* Widgets scroll below */}
            <div
              style={{ height: "30vh" }}
              className="overflow-y-auto p-4 flex flex-col gap-4"
            >
              {leftCol}
              {rightCol}
            </div>
          </div>
        ) : (
          <div className="justify-center h-full grid grid-cols-[280px_30rem_280px] gap-4 p-4 overflow-hidden">
            <div className="flex flex-col justify-center gap-3 overflow-y-auto pr-1">
              {leftCol}
            </div>

            <div className="flex flex-col items-center justify-center">
              <div className="relative w-full max-w-[280px] flex items-start justify-center">
                {renderMedia()}
              </div>
            </div>

            <div className="flex flex-col justify-center gap-3 overflow-y-auto">
              {rightCol}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
