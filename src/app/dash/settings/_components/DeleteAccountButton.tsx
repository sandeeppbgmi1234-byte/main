"use client";

import React, { useState, useTransition } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { deleteFullAccountAction } from "../actions";
import { toast } from "sonner";

export function DeleteAccountButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [hasDeleted, setHasDeleted] = useState(false);

  const handleDelete = () => {
    // Prevent double-clicks immediately
    setHasDeleted(true);
    
    startTransition(async () => {
      try {
        await deleteFullAccountAction();
        toast.success("Account deleted successfully");
      } catch (error) {
        // Reset flag on error to allow retry
        setHasDeleted(false);
        toast.error("Failed to delete account");
        if (process.env.NODE_ENV !== "production") {
          console.error(error);
        }
      }
    });
  };

  return (
    <div className="mt-12 pt-8 border-t border-red-100">
      <div className="flex flex-col gap-4">
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-red-600 flex items-center gap-2">
            <AlertTriangle size={20} />
            Danger Zone
          </h2>
          <p className="text-[#6B7280] text-[14px]">
            Irreversibly delete your account and all associated automation data
          </p>
        </div>

        {!isOpen ? (
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="w-full md:w-fit px-6 py-3 bg-white border border-red-200 text-red-600 hover:bg-red-50 rounded-sm font-semibold text-sm transition-all active:scale-[0.98]"
          >
            Delete My Data Entirely
          </button>
        ) : (
          <div className="bg-red-50 p-6 rounded-lg border border-red-100 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
            <p className="text-sm text-red-800 font-medium leading-relaxed">
              Are you absolutely sure? This will permanently delete your
              Instagram connections, all automations, forms, and subscription
              data. This action cannot be undone.
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                disabled={isPending || hasDeleted}
                onClick={handleDelete}
                className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-sm font-bold text-sm transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {(isPending || hasDeleted) && <Loader2 size={16} className="animate-spin" />}
                Yes, Purge Everything
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={() => setIsOpen(false)}
                className="px-6 py-2.5 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-sm font-medium text-sm transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
