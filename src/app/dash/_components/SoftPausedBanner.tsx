import Link from "next/link";
import { AlertCircle, CreditCard } from "lucide-react";

export function SoftPausedBanner() {
  return (
    <div className="bg-amber-50 border-l-4 border-amber-400 p-4 mb-4 rounded-r-md shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <AlertCircle className="h-5 w-5 text-amber-500" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-amber-800">
            Automations Paused
          </h3>
          <div className="mt-1 text-sm text-amber-700">
            <p>
              Your last payment failed. We&apos;ve temporarily paused your
              automations until this is resolved to prevent any service
              interruptions.
            </p>
          </div>
          <div className="mt-3">
            <Link
              href="/dash/settings?tab=billing"
              className="inline-flex items-center gap-2 px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-colors"
            >
              <CreditCard className="h-3.5 w-3.5" />
              Update Payment Method
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
