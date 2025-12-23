"use client";

import { type ChannelInfo } from "@/helpers/contracts";
import { type FarcasterUserProfile } from "@/helpers/farcaster";
import { formatAddress } from "@/helpers/format";
import { UserDisplay } from "./ChatLine";

export function Sidebar({
  activeTab,
  joinedChannels,
  currentChannel,
  members,
  moderators,
  profiles,
  isConnected,
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
  processCommand: (cmd: string) => Promise<void>;
  setActiveTab: (tab: "chat" | "channels" | "rewards") => void;
  setShowChannelBrowser: (show: boolean) => void;
  setShowCreateChannel: (show: boolean) => void;
}) {
  return (
    <aside
      className={`${
        activeTab === "channels" ? "flex" : "hidden"
      } sm:flex w-[220px] bg-[var(--bg-secondary)] border-r border-[var(--bg-tertiary)] flex-col shrink-0 overflow-hidden max-md:w-[180px] max-sm:absolute max-sm:inset-0 max-sm:w-full max-sm:z-20`}
    >
      {/* Action buttons */}
      <div className="flex gap-2 p-2 border-b border-[var(--bg-tertiary)]">
        <button
          className="flex-1 bg-transparent border border-[var(--primary-muted)] text-[var(--primary)] px-2 py-[0.4rem] font-mono text-[0.7rem] cursor-pointer transition-all hover:not-disabled:bg-[var(--primary-muted)] hover:not-disabled:text-[var(--bg-primary)] disabled:opacity-40 disabled:cursor-not-allowed"
          onClick={() => setShowChannelBrowser(true)}
          title="Browse channels"
        >
          + Join
        </button>
        <button
          className="flex-1 bg-transparent border border-[var(--primary-muted)] text-[var(--primary)] px-2 py-[0.4rem] font-mono text-[0.7rem] cursor-pointer transition-all hover:not-disabled:bg-[var(--primary-muted)] hover:not-disabled:text-[var(--bg-primary)] disabled:opacity-40 disabled:cursor-not-allowed"
          onClick={() => setShowCreateChannel(true)}
          title="Create channel"
          disabled={!isConnected}
        >
          + New
        </button>
      </div>

      {/* Channels */}
      <div className="p-3 border-b border-[var(--bg-tertiary)] overflow-hidden flex flex-col">
        <h3 className="text-[0.7rem] uppercase text-[var(--primary-muted)] mb-2 tracking-[1px] m-0">
          My Channels
        </h3>
        <ul className="list-none p-0 m-0 overflow-y-auto flex-1">
          {joinedChannels.length > 0 ? (
            joinedChannels.map((channel) => (
              <li
                key={channel.slug}
                className={`px-2 py-1 cursor-pointer text-[0.8rem] text-[var(--color-channel)] whitespace-nowrap overflow-hidden text-ellipsis hover:bg-[var(--bg-hover)] ${
                  currentChannel?.slug === channel.slug
                    ? "bg-[var(--bg-tertiary)] text-[var(--color-channel)] border-l-2 border-[var(--color-channel)] !pl-[calc(0.5rem-2px)]"
                    : ""
                }`}
                onClick={() => {
                  processCommand(`/join #${channel.slug}`);
                  setActiveTab("chat");
                }}
              >
                #{channel.slug}
                <span className="ml-1 text-[0.75rem]">
                  ({channel.memberCount.toString()})
                </span>
              </li>
            ))
          ) : (
            <li className="text-[var(--text-dim)] italic cursor-default px-2 py-1 text-[0.8rem]">
              No channels joined
            </li>
          )}
        </ul>
      </div>

      {/* Users */}
      {currentChannel && (
        <div className="p-3 border-b border-[var(--bg-tertiary)] overflow-hidden flex flex-col">
          <h3 className="text-[0.7rem] uppercase text-[var(--primary-muted)] mb-2 tracking-[1px] m-0">
            Users ({members.length})
          </h3>
          <ul className="list-none p-0 m-0 overflow-y-auto flex-1">
            {members.map((member: string) => {
              const isOwner =
                currentChannel.owner.toLowerCase() === member.toLowerCase();
              const isModerator = moderators.some(
                (m: string) => m.toLowerCase() === member.toLowerCase()
              );
              const profile = profiles[member.toLowerCase()];
              return (
                <li
                  key={member}
                  className="px-2 py-1 cursor-pointer text-[0.8rem] hover:bg-[var(--bg-hover)] hover:text-[var(--primary)] flex items-center min-w-0"
                >
                  {isOwner && (
                    <span className="mr-1 text-[0.7rem] text-[var(--color-action)] shrink-0">
                      (owner)
                    </span>
                  )}
                  {!isOwner && isModerator && (
                    <span className="mr-1 text-[0.7rem] text-[var(--color-action)] shrink-0">
                      (mode)
                    </span>
                  )}
                  <UserDisplay
                    address={member}
                    formattedAddress={formatAddress(member)}
                    profile={profile}
                    showActions={true}
                    isSidebar={true}
                  />
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </aside>
  );
}
