"use client";

import { X, ChevronUp, ChevronDown } from "lucide-react";
import { useState } from "react";
import { AutomationInput } from "./AutomationInput";
import { ToggleSwitch } from "./ToggleSwitch";

type Props = {
  anyKeyword: boolean;
  onAnyKeywordChange: (any: boolean) => void;
  keywords: string[];
  onKeywordsChange: (keywords: string[]) => void;
};

const AddKeywords = ({
  anyKeyword,
  onAnyKeywordChange,
  keywords,
  onKeywordsChange,
}: Props) => {
  const [open, setOpen] = useState(true);
  const [input, setInput] = useState("");
  const [removingIndex, setRemovingIndex] = useState<number | null>(null);

  const handleToggleAny = () => {
    const nextState = !anyKeyword;
    onAnyKeywordChange(nextState);
    // Clear keywords when switching to "any keyword" mode
    if (nextState) onKeywordsChange([]);
  };

  const addKeyword = () => {
    const trimmed = input.trim();
    if (trimmed && !keywords.includes(trimmed)) {
      onKeywordsChange([...keywords, trimmed]);
    }
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addKeyword();
    } else if (e.key === "Backspace" && input === "" && keywords.length > 0) {
      removeKeyword(keywords.length - 1);
    }
  };

  const removeKeyword = (index: number) => {
    setRemovingIndex(index);
    setTimeout(() => {
      onKeywordsChange(keywords.filter((_, i) => i !== index));
      setRemovingIndex(null);
    }, 200);
  };

  return (
    <div className="bg-white rounded-lg border border-purple-300 w-full">
      <button
        type="button"
        className="w-full flex items-center justify-between px-4 py-3.5 text-left"
        onClick={() => setOpen((o) => !o)}
      >
        <span className="text-sm font-semibold text-slate-800">
          Setup Keywords
        </span>
        {open ? (
          <ChevronUp size={16} className="text-slate-500" />
        ) : (
          <ChevronDown size={16} className="text-slate-500" />
        )}
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-4">
          <div className="flex items-center justify-between py-1 border-b border-slate-100 pb-3">
            <span className="text-sm font-medium text-slate-800">
              Any Keyword
            </span>
            <ToggleSwitch enabled={anyKeyword} onChange={handleToggleAny} />
          </div>

          {!anyKeyword && (
            <div className="space-y-3">
              {keywords.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {keywords.map((kw, i) => (
                    <span
                      key={kw}
                      onClick={() => removeKeyword(i)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-purple-50 border border-purple-200 text-purple-700 text-xs font-medium cursor-pointer select-none transition-all duration-200"
                      style={{
                        opacity: removingIndex === i ? 0 : 1,
                        transform:
                          removingIndex === i ? "scale(0.8)" : "scale(1)",
                      }}
                    >
                      {kw}
                      <X size={11} className="text-purple-400" />
                    </span>
                  ))}
                </div>
              )}

              <AutomationInput
                type="input"
                value={input}
                onChange={setInput}
                onKeyDown={handleKeyDown}
                onBlur={addKeyword}
                placeholder="Type Any Keyword"
                showEmojiPicker={false}
                showCharCount={false}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AddKeywords;
