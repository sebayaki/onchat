import { type ChannelInfo } from "@/helpers/contracts";
import { type FarcasterUserProfile } from "@/helpers/farcaster";
import { formatAddress } from "@/helpers/format";
import { UserDisplay } from "./ChatLine";
import { UserIcon, ChatIcon, LoadingIcon } from "../Icons";

export function SidebarContent({
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
  onChannelClick,
  hideUsersOnMobile,
  unreadCounts,
}: {
  joinedChannels: ChannelInfo[];
  currentChannel: ChannelInfo | null;
  members: string[];
  moderators: string[];
  profiles: Record<string, FarcasterUserProfile | null>;
  isConnected: boolean;
  isLoadingChannels: boolean;
  processCommand: (cmd: string) => Promise<void>;
  setActiveTab?: (tab: "chat" | "channels" | "rewards") => void;
  setShowChannelBrowser: (show: boolean) => void;
  setShowCreateChannel: (show: boolean) => void;
  onChannelClick?: () => void;
  hideUsersOnMobile?: boolean;
  unreadCounts?: Record<string, number>;
}) {
  return (
    <>
      {/* Action buttons */}
      <div className="flex gap-2 py-2 px-2 border-b border-[var(--bg-tertiary)]">
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
      <div className="py-2 border-b border-[var(--bg-tertiary)] overflow-hidden flex flex-col flex-1 min-h-[120px]">
        <div className="flex items-center gap-2 mb-2 px-2">
          <h3 className="text-[0.7rem] uppercase text-[var(--primary-muted)] tracking-[1px] m-0">
            My Channels
          </h3>
          {isLoadingChannels && joinedChannels.length > 0 && (
            <LoadingIcon size={12} className="text-[var(--primary-muted)]" />
          )}
        </div>
        <ul className="list-none p-0 m-0 overflow-y-auto flex-1 scrollbar-overlay">
          {isLoadingChannels && joinedChannels.length === 0 ? (
            // Loading skeleton (only on initial load)
            <>
              {[1, 2, 3].map((i) => (
                <li key={i} className="px-2 py-1">
                  <div
                    className="h-[1rem] bg-[var(--bg-tertiary)] rounded animate-pulse"
                    style={{ width: `${60 + i * 15}%` }}
                  />
                </li>
              ))}
            </>
          ) : joinedChannels.length > 0 ? (
            [...joinedChannels]
              .sort((a, b) => Number(b.messageCount - a.messageCount))
              .map((channel) => (
                <li
                  key={channel.slug}
                  className={`px-2 py-1 cursor-pointer text-[0.8rem] text-[var(--color-channel)] whitespace-nowrap overflow-hidden text-ellipsis hover:bg-[var(--bg-hover)] ${
                    currentChannel?.slug === channel.slug
                      ? "bg-[var(--bg-tertiary)] text-[var(--color-channel)] border-l-2 border-[var(--color-channel)] !pl-[calc(0.5rem-2px)]"
                      : ""
                  }`}
                  onClick={() => {
                    processCommand(`/join #${channel.slug}`);
                    setActiveTab?.("chat");
                    onChannelClick?.();
                  }}
                >
                  <div className="flex items-center justify-between w-full min-w-0">
                    <div className="flex items-center gap-2 truncate min-w-0">
                      <span className="truncate">#{channel.slug}</span>
                      {(() => {
                        const count = unreadCounts?.[channel.slug] ?? 0;
                        return count > 0 ? (
                          <span className="bg-[var(--color-channel)] text-[var(--bg-primary)] text-[0.6rem] px-1 py-0 rounded-full font-bold min-w-[1.1rem] text-center leading-[1.1rem]">
                            {count > 99 ? "99+" : count}
                          </span>
                        ) : null;
                      })()}
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-2 text-[0.65rem] text-[var(--primary-muted)]">
                      <div className="flex items-center gap-0.5">
                        <UserIcon size={10} className="opacity-70" />
                        <span>{channel.memberCount.toString()}</span>
                      </div>
                      <div className="flex items-center gap-0.5">
                        <ChatIcon size={10} className="opacity-70" />
                        <span>{channel.messageCount.toString()}</span>
                      </div>
                    </div>
                  </div>
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
        <div
          className={`py-2 border-b border-[var(--bg-tertiary)] overflow-hidden flex-col flex-1 min-h-0 ${
            hideUsersOnMobile ? "hidden sm:flex" : "flex"
          }`}
        >
          <h3 className="text-[0.7rem] uppercase text-[var(--primary-muted)] mb-2 tracking-[1px] m-0 px-2">
            Users ({members.length})
          </h3>
          <ul className="list-none p-0 m-0 overflow-y-auto flex-1 scrollbar-overlay">
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
    </>
  );
}
