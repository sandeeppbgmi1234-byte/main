"use client";

import React from "react";
import Image from "next/image";
import MobilePhone from "@/assets/stock-images/Screenshot_20251106_001211_Instagram@2x.png";
import { CreateAutomationModal } from "@/components/dash/automations/create";
import { PlusIcon } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { MobileDashboardHeader } from "../../_components";

const NewAutomationPage = () => {
  const isMobile = useIsMobile();

  if (isMobile) {
    return <NewAutomationMobile />;
  }

  return (
    <div className="relative w-full h-full flex items-center overflow-hidden bg-white justify-evenly rounded-3xl">
      {/* Layer 1: Full-width purple-to-white gradient */}
      <div className="absolute inset-0 bg-linear-to-r from-[#7c22e8] via-[#a855f7]/60 to-white h-full w-full" />

      {/* Layer 2: Phone + concentric dashed strokes */}
      <div className="inset-0 flex items-center">
        <div className="relative flex items-center justify-center w-full">
          {/* Stroke 4 — outermost */}
          <div className="absolute w-[660px] h-[840px] rounded-[72px] border border-dashed border-white/15" />
          {/* Stroke 3 */}
          <div className="absolute w-[580px] h-[760px] rounded-[60px] border border-dashed border-white/25" />
          {/* Stroke 2 */}
          <div className="absolute w-[500px] h-[680px] rounded-[50px] border border-dashed border-white/38" />
          {/* Stroke 1 — closest to phone */}
          <div className="absolute w-[420px] h-[600px] rounded-[40px] border border-dashed border-white/[0.55]" />
          <div className="absolute w-[320px] h-[500px] rounded-[40px] border border-dashed border-white/[0.55]" />

          {/* Phone image */}
          <Image
            src={MobilePhone}
            alt="Instagram DM automation preview"
            height={580}
            className="drop-shadow-[0_24px_72px_rgba(80,0,180,0.38)]"
          />
        </div>
      </div>

      {/* Layer 3: Right-side text content */}
      <div className="relative z-10 flex flex-col gap-5 items-center">
        <h1 className="text-2xl font-bold text-[#071329] leading-tight tracking-tight">
          Launch your first automation
        </h1>
        <p className="text-sm text-[#3A3A3A] font-medium leading-relaxed text-center">
          Automate conversations and watch your
          <br />
          DMs do the work for you
        </p>
        <CreateAutomationModal>
          <button
            type="button"
            className="mt-1 w-fit flex items-center gap-3 bg-[#7c3aed] hover:bg-[#6d28d9] active:bg-[#5b21b6] text-white font-semibold text-[0.95rem] px-6 py-3.5 rounded-md transition-all duration-200 cursor-pointer"
          >
            <PlusIcon />
            Start Automating
          </button>
        </CreateAutomationModal>
      </div>
    </div>
  );
};

const NewAutomationMobile = () => {
  return (
    <div className="flex flex-col h-screen bg-[#f1f1f1] -m-4">
      <div className="m-4">
        <MobileDashboardHeader title="Automations" showSearch={false} />
      </div>
      {/* Main card */}
      <div className="flex-1 bg-white rounded-lg overflow-hidden relative flex flex-col items-center mx-4 mt-2">
        {/* Layer 1: Background Gradient — deep purple fading to white */}
        <div
          className="absolute inset-x-0 top-0"
          style={{
            height: "68%",
            background:
              "linear-gradient(to bottom, #6B21E8 0%, #7C3AED 20%, #9B6CEA 42%, #C4A4F0 62%, #E8D9F9 78%, #F7F2FD 90%, #ffffff 100%)",
          }}
        />

        {/* Layer 2: Concentric dashed rounded-rect strokes */}
        {/* All sized to fit within card width (~375px card → strokes must be < card width) */}

        {/* Outermost stroke */}
        <div
          className="absolute left-1/2 -translate-x-1/2 z-[1]"
          style={{
            top: 8,
            width: 340,
            height: "100vh",
            borderRadius: 48,
            border: "1px dashed rgba(255,255,255,0.22)",
          }}
        />
        {/* Stroke 3 */}
        <div
          className="absolute left-1/2 -translate-x-1/2 z-[1]"
          style={{
            top: 24,
            width: 296,
            height: "100vh",
            borderRadius: 40,
            border: "1px dashed rgba(255,255,255,0.35)",
          }}
        />
        {/* Stroke 2 */}
        <div
          className="absolute left-1/2 -translate-x-1/2 z-[1]"
          style={{
            top: 40,
            width: 252,
            height: "100vh",
            borderRadius: 32,
            border: "1px dashed rgba(255,255,255,0.52)",
          }}
        />
        {/* Stroke 1 — innermost, brightest */}
        <div
          className="absolute left-1/2 -translate-x-1/2 z-[1]"
          style={{
            top: 56,
            width: 208,
            height: "100vh",
            borderRadius: 26,
            border: "1px dashed rgba(255,255,255,0.72)",
          }}
        />

        {/* Phone image */}
        <div className="relative z-10 mt-8">
          <Image
            src={MobilePhone}
            alt="Instagram DM automation preview"
            height={420}
            className="drop-shadow-[0_20px_60px_rgba(80,0,180,0.35)]"
          />
        </div>

        {/* Layer 3: Lower content text */}
        <div className="mt-auto pb-10 px-8 text-center flex flex-col items-center gap-2 z-10">
          <h1 className="text-[16px] font-bold text-[#071329] leading-tight">
            Launch your first automation
          </h1>
          <p className="text-[10px] text-[#3A3A3A] font-medium leading-relaxed max-w-[280px]">
            Automate conversations and watch your DMs do the work for you
          </p>
        </div>
      </div>

      {/* Layer 4: Bottom CTA Button */}
      <div className="p-4 pt-4">
        <CreateAutomationModal>
          <button
            type="button"
            className="w-full bg-[#6A06E4] hover:bg-[#5a05c4] active:scale-[0.98] text-white font-bold py-3 rounded-md text-sm shadow-purple-200 transition-all cursor-pointer"
          >
            New Automation
          </button>
        </CreateAutomationModal>
      </div>
    </div>
  );
};

export default NewAutomationPage;
