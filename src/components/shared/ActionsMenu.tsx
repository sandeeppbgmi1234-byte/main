import { useEffect, useRef } from "react";

type ActionsMenuProps = {
  menuItems: readonly {
    key: string;
    label: string;
    icon: React.ComponentType<{ size?: number }>;
    className?: string;
    bg?: string;
  }[];
  onClose: () => void;
  isStopping?: boolean;
  isDeleting?: boolean;
  isToggling?: boolean;
  toggleLabel?: string;
  isDuplicating?: boolean;
  // Each action is optional — omitting one keeps the button but shows "coming soon"
  onStop?: () => void;
  onDelete?: () => void;
  onActivate?: () => void;
  onEdit?: () => void;
  onCustom?: () => void;
  onToggle?: () => void;
  onDuplicate?: () => void;
};

export function ActionsMenu({
  menuItems,
  onClose,
  isStopping = false,
  isDeleting = false,
  isToggling = false,
  toggleLabel = "Processing...",
  isDuplicating = false,
  onStop,
  onDelete,
  onActivate,
  onEdit,
  onCustom,
  onToggle,
  onDuplicate,
}: ActionsMenuProps) {
  type MenuKey = (typeof menuItems)[number]["key"];

  const menuRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  const handleAction = (key: MenuKey) => {
    switch (key) {
      case "stop":
        if (onStop) onStop();
        break;
      case "activate":
        if (onActivate) onActivate();
        break;
      case "delete":
        if (onDelete) onDelete();
        break;
      case "edit":
        if (onEdit) onEdit();
        break;
      case "copy":
        if (onCustom) onCustom();
        break;
      case "toggle":
        if (onToggle) onToggle();
        break;
      case "duplicate":
        if (onDuplicate && !isDuplicating) {
          onDuplicate();
          break;
        }
        if (isDuplicating) break;
        /* fallthrough */
        import("sonner").then(({ toast }) => {
          toast.info(
            `${key.charAt(0).toUpperCase() + key.slice(1)} coming soon.`,
          );
        });
        onClose();
        break;
    }
  };

  const getStyleClasses = (key: string) => {
    switch (key) {
      case "duplicate":
        return "bg-[#F5F0FF] border-[#D6C5FF] text-[#6A06E4] hover:bg-[#EBE0FF]";
      case "edit":
        return "bg-[#FFF9EB] border-[#FFE5A0] text-[#D97706] hover:bg-[#FFF3D6]";
      case "delete":
      case "stop":
        return "bg-[#FFF0F0] border-[#FFD6D6] text-[#D40000] hover:bg-[#FFE5E5]";
      case "activate":
        return "bg-[#EBFDF5] border-[#D1FAE5] text-[#059669] hover:bg-[#D1FAE5]";
      default:
        return "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100";
    }
  };

  return (
    <div
      ref={menuRef}
      className="absolute right-0 top-10 z-50 min-w-[160px] rounded-xl border border-slate-100 bg-white shadow-xl p-2 flex flex-col gap-1.5 animate-in fade-in zoom-in-95 duration-100"
    >
      {menuItems.map(({ key, label, icon: Icon }) => (
        <button
          key={key}
          disabled={
            (key === "stop" && (isStopping || !onStop)) ||
            (key === "delete" && isDeleting) ||
            (key === "activate" && (isToggling || !onActivate)) ||
            (key === "duplicate" && isDuplicating)
          }
          onClick={() => handleAction(key)}
          className={`w-full flex items-center gap-3 px-3 py-2.5 text-[15px] font-semibold border rounded-lg transition-all active:scale-[0.98] disabled:opacity-50 ${getStyleClasses(key)}`}
        >
          {key === "stop" && isStopping ? (
            <span className="animate-pulse">Stopping…</span>
          ) : key === "delete" && isDeleting ? (
            <span className="animate-pulse">Deleting…</span>
          ) : key === "activate" && isToggling ? (
            <span className="animate-pulse">{toggleLabel}</span>
          ) : key === "duplicate" && isDuplicating ? (
            <span className="animate-pulse">Duplicating…</span>
          ) : (
            <>
              <Icon size={18} />
              {label}
            </>
          )}
        </button>
      ))}
    </div>
  );
}
