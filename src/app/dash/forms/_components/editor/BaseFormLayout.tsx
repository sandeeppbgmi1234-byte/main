"use client";

import React from "react";
import { FormEditorProvider } from "../../../../../providers/FormEditorProvider";
import { FormTabs } from "./FormTabs";
import { useIsMobile } from "@/hooks/use-mobile";
import { usePathname } from "next/navigation";
import EditorHeader from "./EditorHeader";
import MobileLayout from "./mobile/MobileLayout";

interface BaseFormLayoutProps {
  children: React.ReactNode;
  formId?: string;
}

/**
 * Shared layout component for form editor and detail views.
 * Handles mobile/desktop switching and common form actions.
 */
export default function BaseFormLayout({
  children,
  formId,
}: BaseFormLayoutProps) {
  const pathname = usePathname();
  const isMobile = useIsMobile();

  // Determine active tab based on URL path
  const activeTab = pathname.endsWith("/submissions")
    ? "submissions"
    : "editor";

  return (
    <FormEditorProvider formId={formId}>
      {isMobile ? (
        <MobileLayout formId={formId} activeTab={activeTab}>
          {children}
        </MobileLayout>
      ) : (
        <DesktopLayout
          formId={formId}
          activeTab={activeTab}
          pathname={pathname}
        >
          {children}
        </DesktopLayout>
      )}
    </FormEditorProvider>
  );
}

const DesktopLayout = ({
  formId,
  activeTab,
  pathname,
  children,
}: {
  formId?: string;
  activeTab: "editor" | "submissions";
  pathname: string;
  children: React.ReactNode;
}) => {
  return (
    <div className="flex flex-col gap-4 h-full">
      <EditorHeader activeTab={activeTab} />
      <FormTabs formId={formId} activeTab={activeTab} />
      <div
        className="flex-1 overflow-hidden"
        style={{
          backgroundColor: pathname.endsWith("/submissions")
            ? "white"
            : "#E0E0E0",
          borderRadius: "1.5rem",
          border: "1px solid #F1F5F9",
        }}
      >
        {children}
      </div>
    </div>
  );
};
