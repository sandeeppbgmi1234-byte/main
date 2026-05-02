"use client";

import { useEmojiInsertion } from "@/hooks/use-emoji-insertion";
import { EmojiPicker } from "@/components/ui/emoji-picker";

interface AutomationInputProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  maxLength?: number;
  type?: "textarea" | "input";
  rows?: number;
  className?: string;
  showEmojiPicker?: boolean;
  showCharCount?: boolean;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  onBlur?: () => void;
  variant?: "standard" | "mini";
  autoFocus?: boolean;
}

/**
 * Unified input used by all automation widgets — handles char count + emoji picker.
 */
export function AutomationInput({
  value,
  onChange,
  placeholder,
  maxLength,
  type = "textarea",
  rows = 3,
  className = "",
  showEmojiPicker = true,
  showCharCount = true,
  onKeyDown,
  onBlur,
  variant = "standard",
  autoFocus,
}: AutomationInputProps) {
  const { ref, handleEmojiSelect } = useEmojiInsertion<
    HTMLTextAreaElement | HTMLInputElement
  >(value, onChange, maxLength);

  const isMini = variant === "mini";

  const containerStyle = isMini
    ? "relative flex items-center gap-2 transition-all duration-200"
    : "relative bg-[#F8FAFC] rounded-lg p-4 border border-slate-100 focus-within:border-purple-200 focus-within:bg-white transition-all duration-200";

  // Strip disallowed chars and enforce max length
  const sanitize = (val: string) => {
    const cleaned = val.replace(/[<>]/g, "");
    return maxLength ? cleaned.slice(0, maxLength) : cleaned;
  };

  return (
    <div className={`${containerStyle} ${className}`}>
      <div className="flex-1 flex items-center gap-2">
        {type === "textarea" ? (
          <textarea
            ref={ref as React.Ref<HTMLTextAreaElement>}
            value={value}
            onChange={(e) => onChange(sanitize(e.target.value))}
            onKeyDown={onKeyDown}
            onBlur={onBlur}
            placeholder={placeholder}
            rows={rows}
            autoFocus={autoFocus}
            className="w-full bg-transparent text-[#334155] text-[15px] leading-relaxed resize-none outline-none placeholder:text-slate-400"
          />
        ) : (
          <input
            ref={ref as React.Ref<HTMLInputElement>}
            type="text"
            value={value}
            onChange={(e) => onChange(sanitize(e.target.value))}
            onKeyDown={onKeyDown}
            onBlur={onBlur}
            placeholder={placeholder}
            autoFocus={autoFocus}
            className="w-full bg-transparent text-[#334155] text-[15px] font-medium outline-none placeholder:text-slate-400"
          />
        )}
        {isMini && showEmojiPicker && (
          <div onMouseDown={(e) => e.preventDefault()}>
            <EmojiPicker onEmojiSelect={handleEmojiSelect} size={16} />
          </div>
        )}
      </div>

      {/* Footer: char count + emoji picker (standard variant only) */}
      {!isMini && (showCharCount || showEmojiPicker) && (
        <div className="flex items-center justify-between pt-2 border-t border-slate-100/50">
          <div className="text-[12px] font-medium text-slate-400">
            {showCharCount && maxLength ? (
              <span>
                {value.length} / {maxLength}
              </span>
            ) : null}
          </div>
          {showEmojiPicker && (
            <div onMouseDown={(e) => e.preventDefault()}>
              <EmojiPicker onEmojiSelect={handleEmojiSelect} size={18} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
