"use client";

import React, { useState, useRef } from "react";
import type { FormField, FieldType } from "@dm-broo/common-types";
import type {
  UseFormRegister,
  UseFormSetValue,
  UseFormWatch,
  FieldErrors,
} from "react-hook-form";
import {
  Star,
  FileCheck,
  Calendar,
  CalendarIcon,
  UploadCloud,
  Loader2,
  TriangleAlert,
} from "lucide-react";
import { useUploadThing } from "@/lib/uploadthing";
import { toast } from "sonner";
import { CountryPicker } from "./CountryPicker";
import { HierarchicalLocationPicker } from "./HierarchicalLocationPicker";
import { COUNTRIES } from "@/configs/location.config";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as ShadcnCalendar } from "@/components/ui/calendar";
import { FORMS_CONFIG } from "@/configs/forms.config";

type PublicFieldRendererProps = {
  field: FormField;
  register: UseFormRegister<Record<string, string | string[]>>;
  setValue: UseFormSetValue<Record<string, string | string[]>>;
  watch: UseFormWatch<Record<string, string | string[]>>;
  errors?: FieldErrors<Record<string, string | string[]>>;
  onUploadStateChange?: (isUploading: boolean) => void;
};

// Maps field types to the correct HTML input type for the public form
const INPUT_TYPE_MAP: Partial<Record<FieldType, string>> = {
  text: "text",
  number: "number",
  email: "email",
  url: "url",
};

// Internal component to manage the revamped shadcn DatePicker
const DatePickerField = ({
  field,
  fullValue,
  setValue,
  inputClass,
}: {
  field: FormField;
  fullValue: string;
  setValue: UseFormSetValue<Record<string, string | string[]>>;
  inputClass: string;
}) => {
  const [open, setOpen] = React.useState(false);

  const formatDisplay = (val: string) => {
    const digits = val.replace(/\D/g, "");
    let formatted = "";
    for (let i = 0; i < digits.length; i++) {
      if (i === 2 || i === 4) formatted += "/";
      formatted += digits[i];
    }
    return formatted.slice(0, 10);
  };

  const parseDate = (val: string) => {
    const [d, m, y] = val.split("/");
    if (!d || !m || !y || y.length < 4) return null;
    const iso = `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
    const date = new Date(iso);
    return !isNaN(date.getTime()) ? iso : null;
  };

  const selectedDate = React.useMemo(() => {
    if (!fullValue) return undefined;
    const parts = fullValue.split("-");
    if (parts.length !== 3) return undefined;
    const [y, m, d] = parts.map(Number);
    const date = new Date(y, m - 1, d);
    return isNaN(date.getTime()) ? undefined : date;
  }, [fullValue]);

  const [inputValue, setInputValue] = React.useState("");

  React.useEffect(() => {
    if (fullValue) {
      const parts = fullValue.split("-");
      if (parts.length === 3) {
        const [y, m, d] = parts;
        // Ensure parts are valid numbers before setting display
        if (!isNaN(new Date(Number(y), Number(m) - 1, Number(d)).getTime())) {
          setInputValue(`${d.padStart(2, "0")}/${m.padStart(2, "0")}/${y}`);
          return;
        }
      }
    }
    setInputValue("");
  }, [fullValue]);

  return (
    <div className="space-y-1.5 flex flex-col gap-2">
      <label className="text-sm font-semibold text-slate-700">
        {field.label}
        {field.required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <div className="relative flex items-center">
        <input
          type="text"
          inputMode="numeric"
          placeholder="dd/mm/yyyy"
          value={inputValue}
          maxLength={10}
          className={`${inputClass} pr-10`}
          // Open picker on focus to nudge users, but typing is still allowed
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            const formatted = formatDisplay(e.target.value);
            setInputValue(formatted);
            const iso = parseDate(formatted);
            setValue(field.id, iso || "", {
              shouldValidate: true,
              shouldDirty: true,
            });
          }}
        />
        <div className="absolute right-0 top-0 bottom-0 flex items-center pr-3">
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="text-slate-400 hover:text-[#6A06E4] transition-colors cursor-pointer p-0.5 outline-none"
                aria-label="Select date"
              >
                <CalendarIcon size={18} />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end" sideOffset={8}>
              <ShadcnCalendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => {
                  if (date) {
                    const year = date.getFullYear();
                    const month = String(date.getMonth() + 1).padStart(2, "0");
                    const day = String(date.getDate()).padStart(2, "0");
                    setValue(field.id, `${year}-${month}-${day}`, {
                      shouldValidate: true,
                      shouldDirty: true,
                    });
                    setOpen(false);
                  }
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </div>
  );
};

// Internal component to manage the manual file upload with custom UI
const FileUploadField = ({
  field,
  fullValue,
  setValue,
  onUploadStateChange,
}: {
  field: FormField;
  fullValue: string;
  setValue: UseFormSetValue<Record<string, string | string[]>>;
  onUploadStateChange?: (isUploading: boolean) => void;
}) => {
  const [isUploading, setIsUploading] = React.useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { startUpload } = useUploadThing("formAttachment", {
    onClientUploadComplete: (res) => {
      setIsUploading(false);
      onUploadStateChange?.(false);
      if (res?.[0]) {
        const uploadValue = JSON.stringify({
          url: res[0].url,
          name: res[0].name,
        });
        setValue(field.id, uploadValue, {
          shouldValidate: true,
          shouldDirty: true,
        });
        toast.success("File uploaded!");
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    },
    onUploadError: (error: Error) => {
      setIsUploading(false);
      onUploadStateChange?.(false);
      toast.error(`Upload failed: ${error.message}`);
    },
    onUploadBegin: () => {
      setIsUploading(true);
      onUploadStateChange?.(true);
    },
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > FORMS_CONFIG.UPLOAD.MAX_FILE_SIZE) {
      toast.error(
        `File is too big. Max size is ${FORMS_CONFIG.UPLOAD.MAX_FILE_SIZE_FRIENDLY}`,
      );
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    await startUpload([file]);
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    if (file.size > FORMS_CONFIG.UPLOAD.MAX_FILE_SIZE) {
      toast.error(
        `File is too big. Max size is ${FORMS_CONFIG.UPLOAD.MAX_FILE_SIZE_FRIENDLY}`,
      );
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    await startUpload([file]);
  };

  const fileUrl = fullValue;

  return (
    <div className="space-y-1.5 flex flex-col gap-2">
      <label className="text-sm font-semibold text-slate-700">
        {field.label}
        {field.required && <span className="text-red-500 ml-1">*</span>}
      </label>

      {fileUrl ? (
        <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-100 rounded-lg animate-in fade-in zoom-in duration-300">
          <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
            <FileCheck size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-emerald-900 truncate">
              {(() => {
                try {
                  const data = JSON.parse(fileUrl);
                  return data.name || "File uploaded";
                } catch {
                  return "File uploaded";
                }
              })()}
            </p>
            <button
              type="button"
              onClick={() => {
                setValue(field.id, "", {
                  shouldValidate: true,
                  shouldDirty: true,
                });
                if (fileInputRef.current) fileInputRef.current.value = "";
              }}
              className="text-xs text-emerald-600 hover:underline"
            >
              Remove and re-upload
            </button>
          </div>
        </div>
      ) : isUploading ? (
        <div className="flex flex-col items-center justify-center gap-3 border-slate-200 border-2 border-dashed bg-slate-50/50 rounded-lg py-10 animate-pulse">
          <Loader2 size={32} className="text-[#6A06E4] animate-spin" />
          <p className="text-sm font-medium text-[#6A06E4]">Loading...</p>
        </div>
      ) : (
        <div
          onClick={() => fileInputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          className="group relative flex flex-col items-center justify-center gap-2 border-slate-200 border-2 border-dashed bg-slate-50/50 hover:bg-slate-50 hover:border-[#6A06E4]/30 transition-all duration-200 rounded-lg py-10 cursor-pointer"
        >
          <div className="p-3 rounded-full bg-white shadow-sm group-hover:scale-110 transition-transform duration-200">
            <UploadCloud
              size={24}
              className="text-slate-400 group-hover:text-[#6A06E4]"
            />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-slate-600 group-hover:text-[#6A06E4]">
              Choose a file or drag and drop
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Max {FORMS_CONFIG.UPLOAD.MAX_FILE_SIZE_FRIENDLY} • Supports
              images, docs, and more
            </p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
      )}
    </div>
  );
};

// Renders the correct interactive input for each field type
export const PublicFieldRenderer = ({
  field,
  register,
  setValue,
  watch,
  errors,
  onUploadStateChange,
}: PublicFieldRendererProps) => {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  // Controls phone error visibility — hidden while field is active
  const [isPhoneFocused, setIsPhoneFocused] = useState(false);

  // Watch field value at top level to avoid rule of hook violations in branches
  const rawValue = watch(field.id);
  const fullValue = (rawValue as string) || "";
  const checkedValues = (rawValue as string[]) ?? [];

  const inputClass =
    "w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-slate-700 outline-none focus:border-[#6A06E4] focus:ring-1 focus:ring-[#6A06E4] transition-colors";

  // Standard text-like inputs
  if (INPUT_TYPE_MAP[field.type as FieldType]) {
    return (
      <div className="space-y-1.5 flex flex-col gap-2">
        <label className="text-sm font-semibold text-slate-700">
          {field.label}
          {field.required && <span className="text-red-500 ml-1">*</span>}
        </label>
        <input
          {...register(field.id, {
            required: field.required ? `${field.label} is required` : false,
          })}
          type={INPUT_TYPE_MAP[field.type as FieldType] ?? "text"}
          placeholder={
            field.placeholder ||
            (field.type === "text"
              ? "Enter your name..."
              : field.type === "number"
                ? "Enter a number..."
                : field.type === "email"
                  ? "Enter your email address..."
                  : field.type === "url"
                    ? "Enter a website URL..."
                    : "")
          }
          className={`${inputClass} ${errors?.[field.id] ? "border-red-500 focus:ring-red-500" : ""}`}
        />
        {errors?.[field.id] && (
          <p className="text-xs text-red-500 flex items-center gap-1.5">
            <TriangleAlert size={12} />
            {errors[field.id]?.message as string}
          </p>
        )}
      </div>
    );
  }

  // Location — Hierarchical picker (Country > State > City)
  if (field.type === "location") {
    return (
      <div className="space-y-1.5 flex flex-col gap-2">
        <label className="text-sm font-semibold text-slate-700">
          {field.label}
          {field.required && <span className="text-red-500 ml-1">*</span>}
        </label>
        <HierarchicalLocationPicker
          value={fullValue}
          onChange={(val) =>
            setValue(field.id, val, {
              shouldValidate: true,
              shouldDirty: true,
            })
          }
          required={field.required}
        />
        {/* Hidden input to hold the joined value for react-hook-form */}
        <input
          type="hidden"
          {...register(field.id, {
            required: field.required ? `${field.label} is required` : false,
          })}
        />
        {errors?.[field.id] && (
          <p className="text-xs text-red-500 flex items-center gap-1.5">
            <TriangleAlert size={12} />
            {errors[field.id]?.message as string}
          </p>
        )}
      </div>
    );
  }

  // Phone — custom dual-input renderer for country code + 10-digit number
  if (field.type === "phone") {
    // Extract code and number from the joined value (+CODE|phone|NUMBER)
    const parts = fullValue.replace("+", "").split("|phone|");
    const code = parts[0] || "91";
    const number = parts[1] || "";

    // Find selected country for dynamic length meta
    const selectedCountry = COUNTRIES.find(
      (c) => c.dialCode.replace(/\D/g, "") === code.replace(/\D/g, ""),
    );
    const phoneLimit = selectedCountry?.phoneLength || 15;

    // Helper to join code and number
    const handlePhoneChange = (newCode: string, newNum: string) => {
      const cleanCode = newCode.replace(/\D/g, "").slice(0, 4);
      const cleanNum = newNum.replace(/\D/g, "").slice(0, phoneLimit);

      // Always set value so the country code selection is preserved
      setValue(field.id, `+${cleanCode}|phone|${cleanNum}`, {
        shouldValidate: true,
      });
    };

    return (
      <div className="space-y-1.5 flex flex-col gap-2">
        <label className="text-sm font-semibold text-slate-700">
          {field.label}
          {field.required && <span className="text-red-500 ml-1">*</span>}
        </label>
        <div className="flex gap-2">
          {/* Country Picker Toggle */}
          <CountryPicker
            value={code}
            onChange={(newCode) => handlePhoneChange(newCode, "")}
            className="w-24 shrink-0"
          />

          {/* Main Number */}
          <input
            type="text"
            placeholder={
              selectedCountry?.phoneLength === 10
                ? "9998887776"
                : selectedCountry?.phoneLength
                  ? "0".repeat(selectedCountry.phoneLength)
                  : "Enter number"
            }
            value={number}
            onChange={(e) => handlePhoneChange(code, e.target.value)}
            onFocus={() => setIsPhoneFocused(true)}
            onBlur={() => setIsPhoneFocused(false)}
            className={inputClass}
            maxLength={phoneLimit}
            required={field.required}
          />
        </div>
        {/* Hidden input to hold the joined E.164-like value for react-hook-form */}
        <input
          type="hidden"
          {...register(field.id, {
            required: field.required ? `${field.label} is required` : false,
            validate: (val) => {
              if (!field.required && !val) return true;
              if (!val) return `${field.label} is required`;
              const parts = (val as string).split("|phone|");
              const code = parts[0]?.replace("+", "") || "";
              const number = parts[1] || "";
              const selectedCountry = COUNTRIES.find(
                (c) =>
                  c.dialCode.replace(/\D/g, "") === code.replace(/\D/g, ""),
              );
              const limit = selectedCountry?.phoneLength || 15;
              if (number.length !== limit) {
                return `${field.label} must be exactly ${limit} digits`;
              }
              return true;
            },
          })}
        />
        {/* Only show error when field is not focused */}
        {!isPhoneFocused && errors?.[field.id] && (
          <p className="text-xs text-red-500 flex items-center gap-1.5">
            <TriangleAlert size={12} />
            {errors[field.id]?.message as string}
          </p>
        )}
      </div>
    );
  }

  // Dropdown – native select
  if (field.type === "dropdown") {
    return (
      <div className="space-y-1.5 flex flex-col gap-2">
        <label className="text-sm font-semibold text-slate-700">
          {field.label}
          {field.required && <span className="text-red-500 ml-1">*</span>}
        </label>
        <select
          {...register(field.id, {
            required: field.required ? `${field.label} is required` : false,
          })}
          className={`${inputClass} ${errors?.[field.id] ? "border-red-500 focus:ring-red-500" : ""}`}
          defaultValue=""
        >
          <option value="" disabled>
            Select an option
          </option>
          {(field.options ?? []).map((opt) => (
            <option key={opt.id} value={opt.label}>
              {opt.label}
            </option>
          ))}
        </select>
        {errors?.[field.id] && (
          <p className="text-xs text-red-500 flex items-center gap-1.5">
            <TriangleAlert size={12} />
            {errors[field.id]?.message as string}
          </p>
        )}
      </div>
    );
  }

  // Checkbox — allows multiple selections
  if (field.type === "checkbox") {
    const toggleOption = (label: string) => {
      const current = checkedValues.includes(label)
        ? checkedValues.filter((v) => v !== label)
        : [...checkedValues, label];
      setValue(field.id, current, {
        shouldValidate: true,
        shouldDirty: true,
      });
    };

    return (
      <div className="space-y-1.5 flex flex-col gap-2">
        <label className="text-sm font-semibold text-slate-700">
          {field.label}
          {field.required && <span className="text-red-500 ml-1">*</span>}
        </label>
        <div className="space-y-2">
          {(field.options ?? []).map((opt) => (
            <label
              key={opt.id}
              className="flex items-center gap-3 cursor-pointer group"
            >
              <input
                type="checkbox"
                checked={checkedValues.includes(opt.label)}
                onChange={() => toggleOption(opt.label)}
                className="w-4 h-4 accent-[#6A06E4]"
              />
              <span className="text-sm text-slate-600">{opt.label}</span>
            </label>
          ))}
        </div>
        <input
          type="hidden"
          {...register(field.id, {
            validate: (val) => {
              if (field.required && (!val || val.length === 0)) {
                return `${field.label} is required`;
              }
              return true;
            },
          })}
        />
        {errors?.[field.id] && (
          <p className="text-xs text-red-500 flex items-center gap-1.5">
            <TriangleAlert size={12} />
            {errors[field.id]?.message as string}
          </p>
        )}
      </div>
    );
  }

  // Date – revamped shadcn with dd/mm/yy format
  if (field.type === "date") {
    return (
      <div className="space-y-1.5 flex flex-col gap-2">
        <DatePickerField
          field={field}
          fullValue={fullValue}
          setValue={setValue}
          inputClass={inputClass}
        />
        <input
          type="hidden"
          {...register(field.id, {
            required: field.required ? `${field.label} is required` : false,
          })}
        />
        {errors?.[field.id] && (
          <p className="text-xs text-red-500 flex items-center gap-1.5">
            <TriangleAlert size={12} />
            {errors[field.id]?.message as string}
          </p>
        )}
      </div>
    );
  }

  // Star rating
  if (field.type === "rating") {
    return (
      <div className="space-y-1.5 flex flex-col gap-2">
        <label className="text-sm font-semibold text-slate-700">
          {field.label}
          {field.required && <span className="text-red-500 ml-1">*</span>}
        </label>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => {
                setRating(star);
                setValue(field.id, String(star), {
                  shouldValidate: true,
                  shouldDirty: true,
                });
              }}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              className="transition-transform hover:scale-110"
            >
              <Star
                size={28}
                className={
                  star <= (hoverRating || rating)
                    ? "text-[#6A06E4] fill-[#6A06E4]"
                    : "text-slate-200 fill-slate-50"
                }
              />
            </button>
          ))}
        </div>
        <input
          type="hidden"
          {...register(field.id, {
            required: field.required ? `${field.label} is required` : false,
          })}
        />
        {errors?.[field.id] && (
          <p className="text-xs text-red-500 flex items-center gap-1.5">
            <TriangleAlert size={12} />
            {errors[field.id]?.message as string}
          </p>
        )}
      </div>
    );
  }

  if (field.type === "upload") {
    return (
      <div className="space-y-1.5 flex flex-col gap-2">
        <FileUploadField
          field={field}
          fullValue={fullValue}
          setValue={setValue}
          onUploadStateChange={onUploadStateChange}
        />
        <input
          type="hidden"
          {...register(field.id, {
            required: field.required ? `${field.label} is required` : false,
          })}
        />
        {errors?.[field.id] && (
          <p className="text-xs text-red-500 flex items-center gap-1.5">
            <TriangleAlert size={12} />
            {errors[field.id]?.message as string}
          </p>
        )}
      </div>
    );
  }

  // Fallback for unrecognized types
  return null;
};
