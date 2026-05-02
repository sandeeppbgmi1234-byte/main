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

  return (
    <div
      ref={menuRef}
      className="shadow-sm absolute right-0 top-8 z-50 min-w-[150px] rounded-lg border border-slate-100 bg-white animate-in fade-in zoom-in-95 duration-100 p-2"
    >
      {menuItems.map(({ key, label, className, bg }) => (
        <button
          key={key}
          disabled={
            (key === "stop" && (isStopping || !onStop)) ||
            (key === "delete" && isDeleting) ||
            (key === "activate" && (isToggling || !onActivate)) ||
            (key === "duplicate" && isDuplicating)
          }
          onClick={() => handleAction(key)}
          className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm font-medium ${className} ${bg} transition-colors disabled:opacity-50`}
        >
          {key === "stop" && isStopping ? (
            "Stopping…"
          ) : key === "stop" && !onStop ? (
            <span className="opacity-70">{label} (Coming soon)</span>
          ) : key === "delete" && isDeleting ? (
            "Deleting…"
          ) : key === "activate" && isToggling ? (
            toggleLabel
          ) : key === "activate" && !onActivate ? (
            <span className="opacity-70">{label} (Coming soon)</span>
          ) : key === "duplicate" && isDuplicating ? (
            "Duplicating…"
          ) : (
            <>{label}</>
          )}
        </button>
      ))}
    </div>
  );
}
