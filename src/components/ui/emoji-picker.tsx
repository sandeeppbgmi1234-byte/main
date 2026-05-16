"use client";

import dynamic from "next/dynamic";
import { SmilePlus } from "lucide-react";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Dynamically import the picker to reduce initial bundle size
const Picker = dynamic(() => import("emoji-picker-react"), {
  ssr: false,
  loading: () => (
    <div className="w-[350px] h-[400px] flex items-center justify-center bg-white rounded-lg  border border-slate-100">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
    </div>
  ),
});

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
  className?: string;
  size?: number;
}

export function EmojiPicker({
  onEmojiSelect,
  className = "",
  size = 18,
}: EmojiPickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen} modal={false}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={`text-slate-400 hover:text-[#6A06E4] transition-all p-1.5 hover:bg-purple-50 rounded-lg shrink-0 ${className}`}
        >
          <SmilePlus size={size} className="text-black" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        side="bottom"
        align="end"
        className="p-0 border-none  rounded-xl overflow-hidden"
        onCloseAutoFocus={(e) => {
          e.preventDefault();
        }}
      >
        <Picker
          onEmojiClick={(emojiData) => {
            onEmojiSelect(emojiData.emoji);
            setIsOpen(false);
          }}
          skinTonesDisabled
          searchPlaceholder="Search emojis..."
          width={350}
          height={400}
        />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
