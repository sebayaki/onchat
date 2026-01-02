import { SidebarContent } from "./SidebarContent";
import { type ChannelInfo } from "@/helpers/contracts";
import { type FarcasterUserProfile } from "@/helpers/farcaster";

export function Sidebar({
  activeTab,
  joinedChannels,
  currentChannel,
  members,
  moderators,
  profiles,
  isConnected,
  isLoadingChannels,
  processCommand,
  setActiveTab,
  setShowChannelBrowser,
  setShowCreateChannel,
  unreadCounts,
}: {
  activeTab: string;
  joinedChannels: ChannelInfo[];
  currentChannel: ChannelInfo | null;
  members: string[];
  moderators: string[];
  profiles: Record<string, FarcasterUserProfile | null>;
  isConnected: boolean;
  isLoadingChannels: boolean;
  processCommand: (cmd: string) => Promise<void>;
  setActiveTab: (tab: "chat" | "channels" | "rewards") => void;
  setShowChannelBrowser: (show: boolean) => void;
  setShowCreateChannel: (show: boolean) => void;
  unreadCounts: Record<string, number>;
}) {
  // Mobile: show when channels tab active (full screen overlay)
  // Desktop (sm:): always visible as side panel
  return (
    <aside
      data-sidebar="true"
      className={`${activeTab === "channels" ? "flex" : "hidden"} sm:flex
        w-full sm:w-[260px] md:w-[260px]
        absolute inset-0 z-20 sm:relative sm:inset-auto sm:z-auto
        bg-[var(--bg-secondary)] border-r border-[var(--bg-tertiary)] flex-col shrink-0 overflow-hidden`}
    >
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
        unreadCounts={unreadCounts}
      />
    </aside>
  );
}
