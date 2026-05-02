"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import PlusIconSvg from "@/assets/svgs/addthis.svg";
import { useFeatureGates } from "@/hooks/use-feature-gates";
import { useQuery } from "@tanstack/react-query";
import { formKeys } from "@/keys/react-query";
import { formService } from "@/api/services/forms";
import { cn } from "@/server/utils";

/**
 * NewFormButton Component
 * Desktop version of the "New Form" button with integrated plan-limit awareness.
 * Used in the Dashboard Header.
 */
export function NewFormButton() {
  const {
    data: gates,
    isLoading: isLoadingGates,
    isError: isErrorGates,
  } = useFeatureGates();

  // We fetch the forms list to count them
  const {
    data: forms,
    isLoading: isLoadingForms,
    isError: isErrorForms,
  } = useQuery({
    queryKey: formKeys.list(),
    queryFn: () => formService.list(),
  });

  const isLoading = isLoadingGates || isLoadingForms;

  // treat missing/errored responses as "at limit" to be safe
  const isAtLimit =
    isErrorGates ||
    isErrorForms ||
    !gates ||
    !forms ||
    (gates.state.maxForms !== -1 && forms.length >= gates.state.maxForms);

  if (isLoading) {
    return (
      <Button className="bg-[#6A06E4]/50 h-full cursor-wait" disabled>
        <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
        New Form
      </Button>
    );
  }

  const maxForms = gates?.state.maxForms;

  return (
    <Button
      className={cn(
        "bg-[#6A06E4] hover:bg-[#5a05c4] h-full",
        isAtLimit && "opacity-70 cursor-not-allowed grayscale-[0.5]",
      )}
      asChild={!isAtLimit}
      disabled={isAtLimit}
      aria-disabled={isAtLimit}
      title={
        isAtLimit
          ? isErrorGates || isErrorForms || !gates || !forms
            ? "Unable to verify plan limits. Please try again later."
            : `Free plan allows up to ${maxForms} forms. Upgrade to create more.`
          : undefined
      }
    >
      {isAtLimit ? (
        <span className="h-full flex items-center gap-2">
          <Image
            src={PlusIconSvg}
            alt="add"
            width={15}
            height={15}
            className="opacity-50"
          />
          New Form
        </span>
      ) : (
        <Link href="/dash/forms/new" className="h-full flex items-center gap-2">
          <Image src={PlusIconSvg} alt="add" width={15} height={15} />
          New Form
        </Link>
      )}
    </Button>
  );
}
