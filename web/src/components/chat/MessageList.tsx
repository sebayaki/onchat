import { type ChatLine } from "@/hooks/useChat";
import { type FarcasterUserProfile } from "@/helpers/farcaster";
import { ChatLineComponent } from "./ChatLine";
import { RefObject } from "react";
import { MESSAGES_PER_PAGE } from "@/configs/constants";

export function MessageList({
  lines,
  profiles,
  messagesEndRef,
  messagesContainerRef,
  isModerator,
  processCommand,
  showChannelButtons,
  onBrowseChannels,
  onCreateChannel,
  hasMore,
  isLoadingMore,
  onLoadMore,
  lastReadId,
}: {
  lines: ChatLine[];
  profiles: Record<string, FarcasterUserProfile | null>;
  messagesEndRef: RefObject<HTMLDivElement | null>;
  messagesContainerRef?: RefObject<HTMLDivElement | null>;
  isModerator: boolean;
  processCommand: (input: string) => Promise<void>;
  showChannelButtons?: boolean;
  onBrowseChannels?: () => void;
  onCreateChannel?: () => void;
  hasMore?: boolean;
  isLoadingMore?: boolean;
  onLoadMore?: () => void;
  lastReadId?: number;
}) {
  return (
    <div
      ref={messagesContainerRef}
      className="flex-1 overflow-y-auto px-4 py-2 bg-[var(--bg-primary)] scrollbar-thin scrollbar-track-transparent scrollbar-thumb-[var(--bg-tertiary)] hover:scrollbar-thumb-[var(--bg-hover)]"
    >
      <div className="flex flex-col gap-[2px]">
        {hasMore && (
          <div className="flex justify-center py-2 mb-2 border-b border-[var(--bg-tertiary)]/50">
            <button
              onClick={onLoadMore}
              disabled={isLoadingMore}
              className="text-[var(--color-channel)] hover:text-[var(--primary)] transition-colors cursor-pointer font-mono text-[0.85rem] underline disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoadingMore
                ? "Loading more messages..."
                : `Load older messages (${MESSAGES_PER_PAGE} more)`}
            </button>
          </div>
        )}
        {lines.map((line: ChatLine) => (
          <ChatLineComponent
            key={line.id}
            line={line}
            profile={
              line.senderAddress
                ? profiles[line.senderAddress.toLowerCase()]
                : null
            }
            profiles={profiles}
            isModerator={isModerator}
            processCommand={processCommand}
            lastReadId={lastReadId}
          />
        ))}

        {/* Channel action buttons when connected but not in any channel */}
        {showChannelButtons && (
          <div className="chat-line text-[var(--color-info)] flex flex-col items-start">
            <div className="flex items-center">
              <span className="chat-prefix text-[var(--color-info)]">*</span>
              <span className="chat-content">
                Join a channel or create your own to start chatting
              </span>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              <button
                onClick={onBrowseChannels}
                className="bg-transparent border border-[var(--primary-muted)] text-[var(--primary)] px-[0.8rem] py-[0.4rem] font-mono text-[0.8rem] cursor-pointer flex items-center gap-2 transition-all hover:bg-[var(--bg-hover)] hover:border-[var(--primary)]"
              >
                <div className="w-2 h-2 rounded-full bg-[var(--color-channel)] opacity-80" />
                Browse Channels
              </button>
              <button
                onClick={onCreateChannel}
                className="bg-transparent border border-[var(--primary-muted)] text-[var(--primary)] px-[0.8rem] py-[0.4rem] font-mono text-[0.8rem] cursor-pointer flex items-center gap-2 transition-all hover:bg-[var(--bg-hover)] hover:border-[var(--primary)]"
              >
                <div className="w-2 h-2 rounded-full bg-[var(--primary)] opacity-50" />
                Create Channel
              </button>
            </div>
          </div>
        )}
      </div>
      <div ref={messagesEndRef} />
    </div>
  );
}
