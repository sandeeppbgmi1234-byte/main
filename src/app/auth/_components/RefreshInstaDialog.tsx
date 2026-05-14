"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Instagram, RefreshCw } from "lucide-react";
import Image from "next/image";
import RestartIcon from "@/assets/svgs/restart.svg";
import MetaIcon from "@/assets/svgs/meta-color.svg";

export function RefreshInstaDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          type="button"
          className="bg-[#6A06E4] border-none outline-none rounded-lg hover:bg-[#5a05c4] transition-all h-full"
        >
          <Image src={RestartIcon} alt="Restart" width={20} height={20} />
        </Button>
      </DialogTrigger>
      <DialogContent
        showCloseButton={false}
        className="sm:max-w-xl p-8 rounded-[32px] gap-6 flex flex-col items-center"
      >
        <DialogHeader className="space-y-1 items-center">
          <DialogTitle className="text-[23px] font-medium text-[#0F172A] text-center leading-tight">
            Refresh Your Instgram Connection
          </DialogTitle>
          <p className="text-[#64748B] text-center text-sm leading-relaxed max-w-[340px]">
            Refresh Connection to ensure smooth automation of your Instagram
            account
          </p>
        </DialogHeader>

        <div className="flex items-center justify-center gap-6 py-4">
          <div className="w-[72px] h-[72px] rounded-xl bg-white border border-[#F1F5F9] flex items-center justify-center relative overflow-hidden group">
            <div className="absolute inset-0 bg-linear-to-tr from-[#FFB3B3] via-[#FF4D4D] to-[#E60000] opacity-10" />
            <Instagram className="w-10 h-10 text-[#E4405F] relative z-10" />
          </div>

          <RefreshCw className="w-8 h-8 text-[#94A3B8]" />

          <div className="w-[72px] h-[72px] rounded-xl bg-[#6A06E4] flex items-center justify-center">
            <span className="text-white font-semibold text-xs">DmBroo</span>
          </div>
        </div>

        <div className="w-full space-y-4">
          <Button className="w-full h-14 bg-[#6A06E4] hover:bg-[#5a05c4] text-white text-lg font-medium rounded-md transition-all">
            Refresh Connection
          </Button>

          <p className="text-center text-gray-500 text-[12px] px-4 leading-relaxed font-medium">
            You'll be redirected to Instagram to grant permission. <br /> Once
            approved, you'll be connected to us.
          </p>
        </div>

        <div className="pt-4 flex flex-col items-center gap-1 opacity-80">
          <div className="flex items-center gap-1.5">
            <Image src={MetaIcon} alt="meta" width={20} height={20} />
            <span className="text-black font-medium text-xl tracking-tighter">
              Meta
            </span>
          </div>
          <p className="text-black text-[10px] font-semibold uppercase tracking-widest">
            Tech Provider
          </p>
          <p className="text-[#94A3B8] text-[10px] mt-1">
            Certified by Meta as an official Tech Provider.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
