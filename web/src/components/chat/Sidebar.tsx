"use client";

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
}) {
  return (
    <aside
      className={`${
        activeTab === "channels" ? "flex" : "hidden"
      } sm:flex w-[260px] bg-[var(--bg-secondary)] border-r border-[var(--bg-tertiary)] flex-col shrink-0 overflow-hidden max-md:w-[220px] max-sm:absolute max-sm:inset-0 max-sm:w-full max-sm:z-20`}
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
      />
    </aside>
  );
}
