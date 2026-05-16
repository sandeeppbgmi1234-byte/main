"use client";

import React, { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, RefreshCw } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { contactsService } from "@/api/services/contacts";
import { contactKeys } from "@/keys/react-query";
import { toast } from "sonner";
import { cn } from "@/server/utils";

// Characters that trigger spreadsheet formula execution
const FORMULA_PREFIX_RE = /^[\t\r ]*[=+\-@]/;

/**
 * Escapes values for CSV safety
 */
const escapeCsvValue = (val: any) => {
  let str = String(val ?? "");

  // Prevent spreadsheet formula injection by prefixing leading formula chars with a single quote
  if (FORMULA_PREFIX_RE.test(str)) {
    str = "'" + str;
  }

  // Escape internal double quotes for valid CSV formatting
  return `"${str.replace(/"/g, '""')}"`;
};

const CONTACTS_BUTTON_CLASSES =
  "h-full shrink-0 bg-[#7C3AED] hover:bg-[#6D28D9] text-white transition-colors gap-2 px-4 rounded-md font-semibold";

export const ExportContactsButton = () => {
  const [exportStatus, setExportStatus] = useState<
    "idle" | "exporting" | "exported"
  >("idle");

  // Fetch contacts to check availability and for exporting
  // We fetch a large batch for export
  const { data, isLoading } = useQuery({
    queryKey: [...contactKeys.list({ limit: 1000 })],
    queryFn: () => contactsService.list({ limit: 1000 }),
  });

  const contacts = data?.contacts ?? [];
  const hasContacts = contacts.length > 0;

  const handleExport = useCallback(async () => {
    if (!hasContacts) return;

    try {
      setExportStatus("exporting");

      // Define CSV headers for contact data
      const headers = [
        "Contact ID",
        "Username",
        "Email",
        "Last Interaction Kind",
        "Last Interacted At",
      ];

      // Map contact data to CSV rows
      const rows = contacts.map((contact) => {
        const values = [
          contact.id,
          contact.username,
          contact.email || "N/A",
          contact.kind,
          new Date(contact.lastInteractedAt).toLocaleString(),
        ];
        return values.map(escapeCsvValue).join(",");
      });

      // Construct CSV blob and trigger browser download
      const csvContent = [headers.map(escapeCsvValue).join(","), ...rows].join(
        "\n",
      );
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `dmbroo-contacts-${new Date().toISOString().split("T")[0]}.csv`,
      );

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up resources and update UI state
      URL.revokeObjectURL(url);

      setExportStatus("exported");
      toast.success("Contacts exported successfully!");
      setTimeout(() => setExportStatus("idle"), 3000);
    } catch (err) {
      console.error("Contacts Export Error:", err);
      setExportStatus("idle");
      toast.error("Failed to export contacts.");
    }
  }, [contacts, hasContacts]);

  return (
    <Button
      className={cn(
        CONTACTS_BUTTON_CLASSES,
        (!hasContacts || isLoading) && "opacity-50 cursor-not-allowed",
      )}
      type="button"
      disabled={!hasContacts || isLoading || exportStatus !== "idle"}
      onClick={handleExport}
      title={!hasContacts ? "No contacts to export" : "Export contacts to CSV"}
    >
      {exportStatus === "exporting" ? (
        <RefreshCw size={15} className="animate-spin" />
      ) : (
        <Download size={15} />
      )}
      {exportStatus === "exporting"
        ? "Exporting..."
        : exportStatus === "exported"
          ? "Exported"
          : "Export List"}
    </Button>
  );
};
