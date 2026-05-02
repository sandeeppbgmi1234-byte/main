import { GrowthWidget } from "@/components/dash/GrowthWidget";
import { BestPerformerWidget } from "@/components/dash/BestPerformer";
import PlansAndBilling from "@/components/dash/PlansAndBilling";
import { Suspense } from "react";
import { DashboardCardSkeleton } from "@/components/dash/DashboardCard";

export default async function Page() {
  return (
    <div className="grid auto-rows-min gap-4 md:grid-cols-3">
      <div className="md:col-span-3 lg:col-span-2">
        <BestPerformerWidget />
      </div>
      <GrowthWidget type="followers" />
      <GrowthWidget type="outreach" />
      <Suspense fallback={<DashboardCardSkeleton />}>
        <PlansAndBilling />
      </Suspense>
    </div>
  );
}
