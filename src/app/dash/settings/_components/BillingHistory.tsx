import React from "react";
import { CheckCircle2, XCircle, Clock } from "lucide-react";
import { Invoice } from "../types";
import { Separator } from "@/components/ui/separator";

interface BillingHistoryProps {
  invoices: Invoice[];
}

const statusConfig = {
  paid: { icon: CheckCircle2, bg: "bg-[#DCFCE7]", text: "text-[#16A34A]" },
  failed: { icon: XCircle, bg: "bg-[#FEE2E2]", text: "text-[#DC2626]" },
  pending: { icon: Clock, bg: "bg-[#FEF3C7]", text: "text-[#D97706]" },
};

/**
 * BillingHistory Component - Displays a list of recent transactions/invoices.
 */
export function BillingHistory({ invoices }: BillingHistoryProps) {
  return (
    <div className="w-full bg-white border border-[#E5E7EB] rounded-xl p-5 md:p-8 h-full flex flex-col">
      <h3 className="md:text-lg text-base font-semibold text-[#111827] tracking-tight">
        History
      </h3>

      <div className="flex flex-col gap-4 mt-4">
        {invoices.length === 0 ? (
          <p className="text-slate-400 text-sm italic">
            No transaction history found.
          </p>
        ) : (
          invoices.map((invoice, index) => {
            const config = statusConfig[invoice.status] ?? statusConfig.pending;
            const StatusIcon = config.icon;

            return (
              <div key={invoice.id} className="flex flex-col">
                <div className="flex justify-between pb-2">
                  <span className="md:text-[15px] text-sm font-medium text-[#111827] font-mono">
                    {invoice.id}
                  </span>
                  <div className="flex items-center gap-2">
                    <div className={`${config.bg} p-0.5 rounded-full`}>
                      <StatusIcon
                        size={16}
                        className={`${config.text} fill-current/10`}
                      />
                    </div>
                    <span
                      className={`md:text-sm text-sm font-bold ${config.text} capitalize`}
                    >
                      {invoice.status}
                    </span>
                  </div>
                </div>
                {index !== invoices.length - 1 && <Separator />}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
