import { useState, useMemo } from "react";
import { type ChannelInfo } from "@/helpers/contracts";
import { UserIcon, ChatIcon } from "../Icons";

export function ChannelBrowserModal({
  showChannelBrowser,
  setShowChannelBrowser,
  loadingChannels,
  allChannels,
  handleJoinChannel,
  joinedChannels,
  isConnected,
  isLoading,
}: {
  showChannelBrowser: boolean;
  setShowChannelBrowser: (show: boolean) => void;
  loadingChannels: boolean;
  allChannels: ChannelInfo[];
  handleJoinChannel: (slug: string) => Promise<void>;
  joinedChannels: ChannelInfo[];
  isConnected: boolean;
  isLoading: boolean;
}) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredChannels = useMemo(() => {
    if (!searchQuery.trim()) return allChannels;
    const query = searchQuery.toLowerCase();
    return allChannels.filter((ch) => ch.slug.toLowerCase().includes(query));
  }, [allChannels, searchQuery]);

  if (!showChannelBrowser) return null;

  return (
    <div
      className="fixed inset-0 bg-black/85 flex items-center justify-center z-[10000] animate-[fadeIn_0.15s_ease-out]"
      onClick={() => setShowChannelBrowser(false)}
    >
      <div
        className="bg-[var(--bg-secondary)] border border-[var(--primary-muted)] w-[90%] max-w-[400px] max-h-[80vh] flex flex-col animate-[modalSlideIn_0.2s_ease-out]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center px-4 py-3 border-b border-[var(--bg-tertiary)]">
          <h2 className="m-0 text-[0.9rem] text-[var(--primary)] uppercase tracking-[1px] font-mono font-bold">
            Browse Channels
          </h2>
          <button
            className="bg-transparent border-none text-[var(--primary-muted)] text-2xl cursor-pointer leading-none p-0 hover:text-[var(--color-error)]"
            onClick={() => setShowChannelBrowser(false)}
          >
            ×
          </button>
        </div>
        <div className="px-4 py-3 border-b border-[var(--bg-tertiary)]">
          <input
            type="text"
            placeholder="Search channels..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[var(--bg-primary)] border border-[var(--bg-tertiary)] text-[var(--primary)] px-3 py-2 font-mono text-[0.85rem] outline-none focus:border-[var(--primary-muted)] placeholder:text-[var(--primary-muted)] placeholder:opacity-50"
            autoFocus
          />
        </div>
        <div className="p-4 overflow-y-auto flex-1 font-mono max-sm:p-3">
          {loadingChannels ? (
            <div className="text-[var(--primary-muted)] text-center py-8 text-[0.85rem]">
              Loading channels...
            </div>
          ) : allChannels.length === 0 ? (
            <div className="text-[var(--primary-muted)] text-center py-8 text-[0.85rem]">
              No channels yet. Be the first to create one!
            </div>
          ) : filteredChannels.length === 0 ? (
            <div className="text-[var(--primary-muted)] text-center py-8 text-[0.85rem]">
              No channels match "{searchQuery}"
            </div>
          ) : (
            <ul className="list-none p-0 m-0">
              {filteredChannels.map((ch) => (
                <li
                  key={ch.slugHash}
                  className="flex items-center justify-between py-2 border-b border-[var(--bg-tertiary)] last:border-none gap-2"
                >
                  <div className="flex flex-col gap-1 min-w-0">
                    <span className="text-[var(--color-channel)] text-[0.9rem] truncate">
                      #{ch.slug}
                    </span>
                    <div className="flex items-center gap-3 text-[var(--primary-muted)] text-[0.7rem] whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <UserIcon size={12} className="opacity-70" />
                        <span>{ch.memberCount.toString()}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <ChatIcon size={12} className="opacity-70" />
                        <span>{ch.messageCount.toString()}</span>
                      </div>
                    </div>
                  </div>
                  <button
                    className="bg-transparent border border-[var(--primary-muted)] text-[var(--primary)] px-3 py-1 font-mono text-[0.75rem] cursor-pointer transition-all hover:not-disabled:bg-[var(--primary)] hover:not-disabled:text-[var(--bg-primary)] disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                    onClick={() => handleJoinChannel(ch.slug)}
                    disabled={!isConnected || isLoading}
                  >
                    {joinedChannels.some((c) => c.slug === ch.slug)
                      ? "Enter"
                      : "Join"}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
