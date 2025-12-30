import { useState } from "react";
import { type ChannelInfo } from "@/helpers/contracts";
import { type FarcasterUserProfile } from "@/helpers/farcaster";
import { ChevronDownIcon } from "@/components/Icons";
import { SidebarContent } from "./SidebarContent";

export function MobileChannelHeader({
  currentChannel,
  joinedChannels,
  members,
  moderators,
  profiles,
  isConnected,
  isLoadingChannels,
  processCommand,
  setActiveTab,
  setShowChannelBrowser,
  setShowCreateChannel,
}: {
  currentChannel: ChannelInfo | null;
  joinedChannels: ChannelInfo[];
  members: string[];
  moderators: string[];
  profiles: Record<string, FarcasterUserProfile | null>;
  isConnected: boolean;
  isLoadingChannels: boolean;
  processCommand: (cmd: string) => Promise<void>;
  setActiveTab: (tab: "chat" | "channels" | "rewards") => void;
  setShowChannelBrowser: (show: boolean) => void;
  setShowCreateChannel: (show: boolean) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Don't show mobile channel header if no channel is joined
  if (!currentChannel) {
    return null;
  }

  // Hidden on desktop (sm:), visible on mobile
  return (
    <div className="sm:hidden flex flex-col border-b border-[var(--bg-tertiary)] bg-[var(--bg-primary)] shrink-0">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between px-4 py-2 bg-transparent border-none cursor-pointer hover:bg-[var(--bg-hover)] transition-colors"
      >
        <div className="flex items-center gap-2 overflow-hidden">
          <span className="text-[var(--primary-muted)] text-[0.7rem] uppercase font-bold tracking-[1px] shrink-0">
            Channel:
          </span>
          <span className="text-[var(--color-channel)] text-[0.9rem] font-bold truncate">
            #{currentChannel.slug}
          </span>
          <span className="text-[var(--text-dim)] text-[0.7rem] shrink-0">
            ({currentChannel.memberCount.toString()})
          </span>
        </div>
        <ChevronDownIcon
          size={20}
          className={`text-[var(--primary-muted)] transition-transform duration-300 ${
            isExpanded ? "rotate-180" : ""
          }`}
        />
      </button>

      <div
        className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${
          isExpanded
            ? "grid-rows-[1fr] border-t border-[var(--bg-tertiary)]"
            : "grid-rows-[0fr]"
        }`}
      >
        <div className="overflow-hidden bg-[var(--bg-secondary)]">
          <div className="flex flex-col max-h-[60vh] overflow-y-auto">
            <SidebarContent
              joinedChannels={joinedChannels}
              currentChannel={currentChannel}
              members={members}
              moderators={moderators}
              profiles={profiles}
              isConnected={isConnected}
              isLoadingChannels={isLoadingChannels}
              processCommand={processCommand}
              setActiveTab={setActiveTab}
              setShowChannelBrowser={setShowChannelBrowser}
              setShowCreateChannel={setShowCreateChannel}
              onChannelClick={() => setIsExpanded(false)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
