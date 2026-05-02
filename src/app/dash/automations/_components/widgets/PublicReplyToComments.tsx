"use client";

import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { AutomationInput } from "./AutomationInput";
import { ToggleSwitch } from "./ToggleSwitch";
import { PUBLIC_REPLY_LIMIT } from "@/configs/automations.config";

type Reply = { id: string; text: string };

type Props = {
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
  replies: Reply[];
  onRepliesChange: (replies: Reply[]) => void;
};

const PublicReplyToComments = ({
  enabled,
  onEnabledChange,
  replies,
  onRepliesChange,
}: Props) => {
  const [showInput, setShowInput] = useState(false);
  const [inputValue, setInputValue] = useState("");

  const addReply = () => {
    const trimmed = inputValue.trim();
    if (trimmed) {
      onRepliesChange([...replies, { id: crypto.randomUUID(), text: trimmed }]);
    }
    setInputValue("");
    setShowInput(false);
  };

  const removeReply = (id: string) => {
    onRepliesChange(replies.filter((r) => r.id !== id));
  };

  return (
    <div className="bg-white rounded-lg border border-purple-300 w-full overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3.5">
        <span className="text-sm font-semibold text-slate-800">
          Public Reply to Comment
        </span>
        <ToggleSwitch
          enabled={enabled}
          onChange={onEnabledChange}
          ariaLabel={enabled ? "Disable public reply" : "Enable public reply"}
        />
      </div>

      {enabled && (
        <div className="px-4 pb-4 space-y-2">
          {replies.map((reply) => (
            <div
              key={reply.id}
              className="flex items-center gap-2 bg-[#F5F5F5] rounded-lg px-3 py-2.5"
            >
              <span className="flex-1 text-sm text-slate-700 truncate">
                {reply.text}
              </span>
              <button
                type="button"
                onClick={() => removeReply(reply.id)}
                className="text-slate-400 hover:text-red-400 transition-colors shrink-0"
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}

          {showInput && (
            <div className="space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
              <AutomationInput
                type="input"
                value={inputValue}
                onChange={setInputValue}
                placeholder="Type a reply..."
                maxLength={PUBLIC_REPLY_LIMIT}
                showCharCount
                onKeyDown={(e) => {
                  if (e.key === "Enter") addReply();
                  if (e.key === "Escape") {
                    setShowInput(false);
                    setInputValue("");
                  }
                }}
                autoFocus
              />
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowInput(false);
                    setInputValue("");
                  }}
                  className="px-3 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={addReply}
                  className="px-4 py-1.5 text-xs font-semibold bg-[#6A06E4] text-white rounded-lg hover:bg-[#5a05c4] transition-colors"
                >
                  Add Reply
                </button>
              </div>
            </div>
          )}

          {!showInput && (
            <button
              type="button"
              onClick={() => setShowInput(true)}
              className="flex items-center gap-1.5 text-sm font-medium text-[#6A06E4] hover:text-[#5a05c4] transition-colors pt-1"
            >
              <Plus size={15} />
              Add Public Reply
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default PublicReplyToComments;
