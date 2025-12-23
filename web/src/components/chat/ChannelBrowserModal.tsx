"use client";

import { type ChannelInfo } from "@/helpers/contracts";

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
  if (!showChannelBrowser) return null;

  return (
    <div
      className="fixed inset-0 bg-black/85 flex items-center justify-center z-[10000] animate-[fadeIn_0.15s_ease-out]"
      onClick={() => setShowChannelBrowser(false)}
    >
      <div
        className="bg-[var(--bg-secondary)] border border-[var(--text-muted)] w-[90%] max-w-[400px] max-h-[80vh] flex flex-col animate-[modalSlideIn_0.2s_ease-out]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center px-4 py-3 border-b border-[var(--bg-tertiary)]">
          <h2 className="m-0 text-[0.9rem] text-[var(--text-primary)] uppercase tracking-[1px] font-mono font-bold">
            Browse Channels
          </h2>
          <button
            className="bg-transparent border-none text-[var(--text-muted)] text-2xl cursor-pointer leading-none p-0 hover:text-[var(--color-error)]"
            onClick={() => setShowChannelBrowser(false)}
          >
            ×
          </button>
        </div>
        <div className="p-4 overflow-y-auto flex-1 font-mono max-sm:p-3">
          {loadingChannels ? (
            <div className="text-[var(--text-muted)] text-center py-8 text-[0.85rem]">
              Loading channels...
            </div>
          ) : allChannels.length === 0 ? (
            <div className="text-[var(--text-muted)] text-center py-8 text-[0.85rem]">
              No channels yet. Be the first to create one!
            </div>
          ) : (
            <ul className="list-none p-0 m-0">
              {allChannels.map((ch) => (
                <li
                  key={ch.slugHash}
                  className="flex items-center justify-between py-2 border-b border-[var(--bg-tertiary)] last:border-none gap-2"
                >
                  <div className="flex flex-col gap-1 min-w-0">
                    <span className="text-[var(--color-channel)] text-[0.9rem] truncate">
                      #{ch.slug}
                    </span>
                    <span className="text-[var(--text-muted)] text-[0.7rem] whitespace-nowrap">
                      {ch.memberCount.toString()} users •{" "}
                      {ch.messageCount.toString()} msgs
                    </span>
                  </div>
                  <button
                    className="bg-transparent border border-[var(--text-muted)] text-[var(--text-primary)] px-3 py-1 font-mono text-[0.75rem] cursor-pointer transition-all hover:not-disabled:bg-[var(--text-primary)] hover:not-disabled:text-[var(--bg-primary)] disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
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
