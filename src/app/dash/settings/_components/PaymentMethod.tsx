import React from "react";
import { CreditCard, Wallet, Landmark } from "lucide-react";
import UpiIcon from "@/assets/svgs/upi-icon.svg";
import Image from "next/image";

interface PaymentMethodProps {
  method: string | null | undefined;
  detail: string | null | undefined;
}

/**
 * PaymentMethod Component - Shows current payment info with a 'Change' option.
 * Design matches the dashboard's premium aesthetic.
 */
export function PaymentMethod({ method, detail }: PaymentMethodProps) {
  if (!method) return null;

  return (
    <div className="w-full bg-white border border-[#E5E7EB] rounded-xl p-5 md:p-8">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-4">
          <h3 className="md:text-lg text-base font-semibold text-[#111827] tracking-tight">
            Payment Method
          </h3>
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center shrink-0">
              <PaymentIcon method={method} />
            </div>
            <span className="md:text-[15px] text-sm font-medium text-[#111827]">
              {detail || "No details provided"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Helper to render specific payment icons based on method type.
 */
function PaymentIcon({ method }: { method: string }) {
  const m = method.toLowerCase();

  if (m === "upi") {
    return <Image src={UpiIcon} alt="UPI" width={22} height={22} />;
  }

  if (m === "card") return <CreditCard size={22} className="text-[#6A06E4]" />;
  if (m === "netbanking")
    return <Landmark size={22} className="text-[#6A06E4]" />;

  return <Wallet size={22} className="text-[#6A06E4]" />;
}
