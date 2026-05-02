"use client";

import React, { useCallback, useState } from "react";
import Image from "next/image";
import { ImageIcon, Trash2 } from "lucide-react";
import { Controller, useFormContext } from "react-hook-form";
import { useUploadThing } from "@/lib/uploadthing";
import type { FormValues } from "@dm-broo/common-types";
import { useFormEditor } from "../../../../../providers/FormEditorProvider";

// Cover image area with upload overlay and delete button
// Uses uploadthing's hook under the hood, fires onChange to react-hook-form
export default function CoverImageUpload() {
  const { control } = useFormContext<FormValues>();

  return (
    <Controller
      name="coverImage"
      control={control}
      render={({ field }) => (
        <CoverImageArea value={field.value} onChange={field.onChange} />
      )}
    />
  );
}

type CoverImageAreaProps = {
  value: string | undefined;
  onChange: (url: string | undefined) => void;
};

const CoverImageArea = ({ value, onChange }: CoverImageAreaProps) => {
  const { setIsMediaUploading } = useFormEditor();

  const { startUpload, isUploading } = useUploadThing("imageUploader", {
    onUploadBegin: () => setIsMediaUploading(true),
    onClientUploadComplete: (res) => {
      setIsMediaUploading(false);
      if (res[0]?.ufsUrl) onChange(res[0].ufsUrl);
    },
    onUploadError: () => {
      setIsMediaUploading(false);
    },
  });

  const [isDragging, setIsDragging] = useState(false);

  const startUploadFiles = useCallback(
    (files: File[]) => {
      const filteredFiles = files.filter((f) => f.type?.startsWith("image/"));
      if (filteredFiles.length > 0) {
        // Only upload the first image for cover field
        startUpload([filteredFiles[0]]);
      }
    },
    [startUpload],
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (isUploading) return;
      const files = Array.from(e.target.files ?? []);
      startUploadFiles(files);
      // Reset input value to allow uploading the same file twice
      e.target.value = "";
    },
    [isUploading, startUploadFiles],
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!isUploading) setIsDragging(true);
    },
    [isUploading],
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Only clear if we actually left the drop zone container
    if (e.currentTarget.contains(e.relatedTarget as Node)) {
      return;
    }
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      if (isUploading) return;

      const files = Array.from(e.dataTransfer.files);
      startUploadFiles(files);
    },
    [isUploading, startUploadFiles],
  );

  const handleDelete = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onChange(undefined);
    },
    [onChange],
  );

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`relative w-[90%] h-40 rounded-lg overflow-hidden bg-slate-200 group transition-all duration-200 ${
        isDragging
          ? "ring-2 ring-[#6A06E4] ring-offset-2 scale-[0.99] bg-slate-300"
          : ""
      }`}
    >
      {/* Background image when uploaded */}
      {value && <Image src={value} alt="Cover" fill className="object-cover" />}

      {/* Control overlay — only visible on hover if image exists, always visible if empty */}
      <div
        className={`absolute inset-0 flex flex-col items-center justify-center gap-3 ${
          value || isDragging
            ? "bg-black/20 hover:bg-black/40 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 focus-within:opacity-100"
            : "bg-black/10"
        } ${isDragging ? "opacity-100 bg-black/40" : ""} transition-all duration-300`}
      >
        {isDragging && (
          <div className="flex flex-col items-center gap-2 text-white animate-bounce">
            <ImageIcon size={32} />
            <span className="text-sm font-bold">Drop to upload</span>
          </div>
        )}

        <div
          className={`flex items-center gap-2 ${isDragging ? "hidden" : ""}`}
        >
          {/* Upload trigger */}
          <label
            className={`flex items-center text-[#6A06E4] gap-1.5 bg-white/90 rounded-full px-4 py-2 text-xs font-semibold transition-all transform ${
              isUploading
                ? "opacity-50 cursor-not-allowed"
                : "hover:bg-white cursor-pointer hover:scale-105 active:scale-95"
            }`}
          >
            <ImageIcon size={14} className="text-[#6A06E4]" />
            {isUploading
              ? "Uploading…"
              : value
                ? "Select/Drop an image"
                : "Select/Drop an image"}
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={handleFileChange}
              disabled={isUploading}
              multiple={false}
            />
          </label>

          {/* Delete button — only shown if image exists */}
          {value && (
            <button
              type="button"
              onClick={handleDelete}
              className="bg-red-500 hover:bg-red-600 rounded-full p-2 transition-all transform hover:scale-105 active:scale-95"
              aria-label="Remove cover image"
            >
              <Trash2 size={14} className="text-white" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
