import { getFollowerSnapshots } from "@/server/repository/instagram/follower-snapshot.repository";
import { ApiRouteError } from "@/server/middleware/errors/classes";
import { prisma } from "@/server/db";

interface DataPoint {
  label: string;
  value: number;
}

/**
 * Follower Growth Service (Refactored)
 * Returns the sum of followers gained via automations (Attribution)
 * and the daily net growth trend from snapshots (Chart Data).
 */
export async function getFollowersGrowthStats(
  instaAccountId: string,
  rangeLabel: string,
) {
  const account = await prisma.instaAccount.findUnique({
    where: { id: instaAccountId, isActive: true },
    select: { id: true },
  });

  if (!account) {
    throw new ApiRouteError("Instagram account not found", "NOT_FOUND", 404);
  }

  // Determine date range for the widget
  const now = new Date();
  const todayUtc = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );

  let daysParam = 7;
  const rangeMatch = rangeLabel.match(/^Last (\d+)\s*(days?)$/i);
  if (rangeMatch) {
    daysParam = parseInt(rangeMatch[1], 10);
  } else if (rangeLabel === "Last 30 days") {
    daysParam = 30;
  } else if (rangeLabel === "All time") {
    daysParam = 90; // Limit chart to 90 days for performance
  }

  const startDateUtc = new Date(
    todayUtc.getTime() - (daysParam - 1) * 24 * 60 * 60 * 1000,
  );

  // 1. ATTRIBUTION: Sum of followers gained via automations
  // We respect the filter by looking at automations that were active/triggered in these days
  const attributedSum = await prisma.automation.aggregate({
    where: {
      instaAccountId,
      status: { in: ["ACTIVE", "STOPPED"] },
      // We sum for automations that were last triggered in this window as a proxy for relevance
      lastTriggeredAt:
        rangeLabel === "All time" ? undefined : { gte: startDateUtc },
    },
    _sum: {
      newFollowersGained: true,
    },
  });

  const totalGained = attributedSum._sum.newFollowersGained || 0;

  // 2. CHART DATA: Daily Net Growth (Deltas)
  // To calculate the delta for the first day, we need the day before the start date
  const startDateMinusOne = new Date(
    startDateUtc.getTime() - 24 * 60 * 60 * 1000,
  );

  const snapshots = await getFollowerSnapshots(
    instaAccountId,
    startDateMinusOne,
  );

  const snapshotMap = new Map<number, number>();
  snapshots.forEach((snap) => {
    snapshotMap.set(snap.date.getTime(), snap.followersCount);
  });

  const chartData: DataPoint[] = [];
  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  for (let i = 0; i < daysParam; i++) {
    const currentDayTime = startDateUtc.getTime() + i * 24 * 60 * 60 * 1000;
    const prevDayTime = currentDayTime - 24 * 60 * 60 * 1000;

    const currentCount = snapshotMap.get(currentDayTime);
    const prevCount = snapshotMap.get(prevDayTime);

    // Default delta to 0 if data is missing
    let dailyDelta = 0;
    if (currentCount !== undefined && prevCount !== undefined) {
      dailyDelta = currentCount - prevCount;
    }

    const dateObj = new Date(currentDayTime);
    chartData.push({
      label: `${dateObj.getUTCDate()} ${monthNames[dateObj.getUTCMonth()]}`,
      value: dailyDelta,
    });
  }

  return {
    growth: totalGained,
    data: chartData,
  };
}
