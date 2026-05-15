"use client";

import { useFormContext } from "react-hook-form";
import type { FormValues } from "@dm-broo/common-types";
import { useEmojiInsertion } from "@/hooks/use-emoji-insertion";
import { EmojiPicker } from "@/components/ui/emoji-picker";

// Editable title and description bound to react-hook-form
export default function FormTitleSection() {
  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = useFormContext<FormValues>();

  const title = watch("title") || "";
  const description = watch("description") || "";

  // Emoji insertion logic
  const { ref: titleInputRef, handleEmojiSelect: handleTitleEmoji } =
    useEmojiInsertion<HTMLInputElement>(title, (val) =>
      setValue("title", val, { shouldDirty: true, shouldValidate: true }),
    );

  const { ref: descInputRef, handleEmojiSelect: handleDescEmoji } =
    useEmojiInsertion<HTMLInputElement>(description, (val) =>
      setValue("description", val, { shouldDirty: true, shouldValidate: true }),
    );

  // Hook form registrations with ref merging
  const { ref: registerTitleRef, ...titleRegister } = register("title");
  const { ref: registerDescRef, ...descRegister } = register("description");

  return (
    <div className="space-y-0.5 w-[90%]">
      {/* Title */}
      <div className="flex items-center justify-between gap-2">
        <input
          {...titleRegister}
          ref={(e) => {
            registerTitleRef(e);
            (titleInputRef as any).current = e;
          }}
          placeholder="Add a title"
          className="flex-1 text-lg font-bold text-[#071329] placeholder:text-black/70 bg-transparent outline-none"
        />
        <div onMouseDown={(e) => e.preventDefault()}>
          <EmojiPicker onEmojiSelect={handleTitleEmoji} size={20} />
        </div>
      </div>
      {errors.title && (
        <p className="text-xs text-red-500">{errors.title.message}</p>
      )}

      {/* Description */}
      <div className="flex items-center justify-between gap-2">
        <input
          {...descRegister}
          ref={(e) => {
            registerDescRef(e);
            (descInputRef as any).current = e;
          }}
          placeholder={"Add short description"}
          className="flex-1 text-sm text-slate-500 bg-transparent outline-none placeholder:text-slate-500"
        />
        <div onMouseDown={(e) => e.preventDefault()}>
          <EmojiPicker onEmojiSelect={handleDescEmoji} size={16} />
        </div>
      </div>
    </div>
  );
}
