export const StatusBadge = ({ status }: { status: string }) => {
  const colorMap: Record<string, string> = {
    ACTIVE: "text-[#068E19]",
    PUBLISHED: "text-[#068E19]",
    DRAFT: "text-[#1D81D8]",
    EXPIRED: "text-orange-500",
    STOPPED: "text-red-400",
  };
  const labelMap: Record<string, string> = {
    ACTIVE: "Live",
    PUBLISHED: "Live",
    DRAFT: "Draft",
    EXPIRED: "Expired",
    STOPPED: "Stopped",
  };
  return (
    <span
      className={`font-semibold text-base ${colorMap[status] ?? "text-slate-500"}`}
    >
      {labelMap[status] ?? status}
    </span>
  );
};
