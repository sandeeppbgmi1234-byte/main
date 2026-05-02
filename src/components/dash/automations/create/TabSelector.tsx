"use client";
import { useRouter } from "next/navigation";

const tabs = [
  {
    id: "dm-from-comments",
    title: "DM from Comments",
    description:
      "Send links instantly when people comment on your post or reel",
  },
  {
    id: "dm-from-stories",
    title: "DM from Stories",
    description: "Automate responses when people interact with your stories",
  },
  {
    id: "respond-to-all-dms",
    title: "Respond to All DMs",
    description: "Automate responses when people interact with your stories",
  },
];

export default function TabSelector({
  setActiveTab,
  activeTab,
}: {
  setActiveTab: (value: string | null) => void;
  activeTab?: string | null;
}) {
  const router = useRouter();

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-4">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={tab.id === activeTab}
          className={`group relative rounded-lg border p-6 transition-all cursor-pointer flex flex-col text-left ${
            tab.id === activeTab
              ? "bg-white border-purple-200 shadow-sm"
              : "border-gray-100 bg-gray-50/50 hover:bg-white hover:border-purple-200 hover:shadow-sm"
          }`}
          onClick={() => {
            if (tab.id === "respond-to-all-dms") {
              router.push("/dash/automations/new/dms");
            } else {
              setActiveTab(tab.id);
            }
          }}
        >
          <h3 className="text-base font-semibold text-purple-600 mb-2">
            {tab.title}
          </h3>
          <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">
            {tab.description}
          </p>
        </button>
      ))}
    </div>
  );
}
