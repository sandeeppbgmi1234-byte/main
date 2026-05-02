import { Link as LinkIcon } from "lucide-react";
import { AutomationInput } from "./AutomationInput";
import { ToggleSwitch } from "./ToggleSwitch";
import { useFeatureGates } from "@/hooks/use-feature-gates";
import { LockedOverlay } from "@/components/dash/LockedOverlay";
import { ASK_TO_FOLLOW_CONFIG } from "@/configs/widgets.config";
import Image from "next/image";
import CrownIcon from "@/assets/svgs/CrownIcon.svg";

interface AskToFollowProps {
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
  message: string;
  onMessageChange: (message: string) => void;
}

const AskToFollow = ({
  enabled,
  onEnabledChange,
  message,
  onMessageChange,
}: AskToFollowProps) => {
  const { data: gates } = useFeatureGates();
  const isLocked = gates?.access?.hasAskToFollow === false;

  return (
    <LockedOverlay isLocked={isLocked} className="w-full">
      <div className="bg-white rounded-2xl border border-purple-300 w-full overflow-hidden transition-all duration-200">
        {/* Header with toggle */}
        <div className="flex items-center justify-between px-5 py-4">
          <div className="flex items-center justify-center gap-2">
            <h3 className="text-sm font-semibold text-slate-800">
              {ASK_TO_FOLLOW_CONFIG.TITLE}
            </h3>
            {isLocked && (
              <Image
                src={CrownIcon}
                width={16}
                height={16}
                alt={"Feature locked"}
              />
            )}
          </div>
          <ToggleSwitch
            enabled={enabled}
            onChange={onEnabledChange}
            ariaLabel={
              enabled ? "Disable ask to follow" : "Enable ask to follow"
            }
          />
        </div>

        {enabled && (
          <div className="px-5 pb-5 space-y-4">
            <AutomationInput
              value={message}
              onChange={onMessageChange}
              maxLength={ASK_TO_FOLLOW_CONFIG.MAX_CHARS}
              placeholder="Enter follow message..."
            />

            {/* Static visit profile indicator */}
            <div className="flex items-center justify-between bg-[#F5F3FF] rounded-lg px-4 py-3 border border-purple-50 group transition-all hover:bg-[#EDE9FE]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-[#6A06E4]">
                  <LinkIcon size={16} />
                </div>
                <span className="text-sm font-semibold text-[#4F46E5]">
                  Visit Profile
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </LockedOverlay>
  );
};

export default AskToFollow;
