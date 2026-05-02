"use client";

import { Pencil } from "lucide-react";
import { useState } from "react";
import { AutomationInput } from "./AutomationInput";
import { ToggleSwitch } from "./ToggleSwitch";
import { OPENING_MESSAGE_CONFIG } from "@/configs/widgets.config";

type Props = {
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
  message: string;
  onMessageChange: (message: string) => void;
  buttonText: string;
  onButtonTextChange: (text: string) => void;
};

const OpeningMessage = ({
  enabled,
  onEnabledChange,
  message,
  onMessageChange,
  buttonText,
  onButtonTextChange,
}: Props) => {
  const [isEditable, setIsEditable] = useState(false);

  return (
    <div className="bg-white rounded-lg border border-purple-300 w-full overflow-hidden">
      {/* Header with toggle */}
      <div className="flex items-center justify-between px-4 py-3.5">
        <span className="text-sm font-bold text-slate-800">
          {OPENING_MESSAGE_CONFIG.TITLE}
        </span>
        <ToggleSwitch
          enabled={enabled}
          onChange={onEnabledChange}
          ariaLabel={
            enabled ? "Disable opening message" : "Enable opening message"
          }
        />
      </div>

      {enabled && (
        <div className="px-4 pb-4 animate-in fade-in slide-in-from-top-2 duration-300">
          <AutomationInput
            value={message}
            onChange={onMessageChange}
            maxLength={OPENING_MESSAGE_CONFIG.MAX_CHARS}
            placeholder="Type your opening message..."
            className="mb-3"
          />

          {/* Button text preview/edit */}
          <div className="bg-[#F6EFFF] rounded-lg flex items-center justify-between border border-purple-100 group">
            <div className="flex-1 flex items-center gap-2">
              <AutomationInput
                variant="mini"
                type="input"
                value={buttonText}
                onChange={onButtonTextChange}
                placeholder="Button text..."
                className={`p-3 border-none bg-transparent w-full ${!isEditable ? "pointer-events-none opacity-80" : ""}`}
                showEmojiPicker={isEditable}
              />
            </div>
            <button
              onClick={() => setIsEditable(!isEditable)}
              type="button"
              className={`text-[#6A06E4] opacity-80 hover:opacity-100 transition-opacity p-2 ${isEditable ? "text-green-500" : ""}`}
            >
              <Pencil size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default OpeningMessage;
