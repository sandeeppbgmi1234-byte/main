/**
 * UsageBar component: visualizes credit usage percentage.
 */

interface UsageBarProps {
  used: number;
  limit: number;
}

export function UsageBar({ used, limit }: UsageBarProps) {
  // Handle unlimited case (-1)
  const percentage = limit === -1 ? 0 : Math.min((used / limit) * 100, 100);
  const isExhausted = limit !== -1 && used >= limit;

  return (
    <div className="w-full space-y-3">
      <div className="flex justify-between items-end">
        <span className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Monthly Credit Usage
        </span>
        <span
          className={`text-lg font-bold ${isExhausted ? "text-red-500" : "text-primary"}`}
        >
          {limit === -1 ? "Unlimited" : `${Math.round(percentage)}% Used`}
        </span>
      </div>

      <div className="h-6 w-full bg-muted rounded-xl overflow-hidden border">
        <div
          className={`h-full transition-all duration-700 ease-out flex items-center justify-end pr-3 ${
            isExhausted ? "bg-red-500" : "bg-primary"
          }`}
          style={{ width: `${limit === -1 ? 0 : percentage}%` }}
        >
          {percentage > 15 && (
            <span className="text-[10px] font-bold text-white uppercase tracking-tighter">
              {used.toLocaleString()} Used
            </span>
          )}
        </div>
      </div>

      {isExhausted && (
        <p className="text-xs text-red-500 font-medium animate-pulse">
          Quota reached. Upgrade to continue automations.
        </p>
      )}
    </div>
  );
}
