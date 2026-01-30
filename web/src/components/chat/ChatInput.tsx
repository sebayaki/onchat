import { type ChannelInfo } from "@/helpers/contracts";
import { type FarcasterUserProfile } from "@/helpers/farcaster";
import { RefObject } from "react";
import { SendIcon, LoadingIcon, ReplyIcon } from "../Icons";
import { formatAddress } from "@/helpers/format";

export function ChatInput({
  input,
  setInput,
  handleKeyDown,
  handleSubmit,
  isLoading,
  isConnected,
  isWalletLoading,
  isLoadingChannels,
  currentChannel,
  showJoinButton,
  handleJoinChannel,
  channelSlug,
  inputRef,
  sendButtonRef,
  replyContext,
  cancelReply,
  profiles,
}: {
  input: string;
  setInput: (val: string) => void;
  handleKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  handleSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
  isConnected: boolean;
  isWalletLoading: boolean;
  isLoadingChannels?: boolean;
  currentChannel: ChannelInfo | null;
  showJoinButton: boolean | "" | undefined;
  handleJoinChannel: (slug: string) => Promise<void>;
  channelSlug?: string;
  inputRef: RefObject<HTMLInputElement | null>;
  sendButtonRef?: RefObject<HTMLButtonElement | null>;
  replyContext?: {
    messageIndex: number;
    content: string;
    senderAddress?: string;
  } | null;
  cancelReply?: () => void;
  profiles?: Record<string, FarcasterUserProfile | null>;
}) {
  // Get display name for reply context
  const replyToName = replyContext?.senderAddress
    ? profiles?.[replyContext.senderAddress.toLowerCase()]?.username
      ? `@${profiles[replyContext.senderAddress.toLowerCase()]!.username}`
      : formatAddress(replyContext.senderAddress)
    : null;

  return (
    <div className="bg-[var(--bg-secondary)] border-t border-[var(--bg-tertiary)] mb-[env(safe-area-inset-bottom)] sm:mb-0">
      {/* Reply preview banner */}
      {replyContext && (
        <div className="flex items-center gap-2 px-4 py-2 bg-[var(--bg-tertiary)]/50 border-b border-[var(--bg-tertiary)]">
          <ReplyIcon size={14} className="text-[var(--text-dim)] shrink-0" />
          <div className="flex-1 min-w-0 text-[0.75rem] font-mono">
            <span className="text-[var(--text-dim)]">Replying to </span>
            <span className="text-[var(--color-nick)]">{replyToName}</span>
            <span className="text-[var(--text-dim)]"> · </span>
            <span className="text-[var(--color-content)] truncate inline-block max-w-[200px] sm:max-w-[400px] align-bottom">
              {replyContext.content.length > 50
                ? `${replyContext.content.slice(0, 50)}...`
                : replyContext.content}
            </span>
          </div>
          <button
            type="button"
            onClick={cancelReply}
            className="text-[var(--text-dim)] hover:text-[var(--color-error)] transition-colors text-[0.7rem] font-mono px-2 py-0.5 shrink-0"
          >
            ✕
          </button>
        </div>
      )}
      <form
        className="flex items-center px-4 py-2 gap-2 relative"
        onSubmit={handleSubmit}
      >
        {(showJoinButton ||
          ((isWalletLoading || isLoadingChannels) && channelSlug)) && (
          <div className="absolute inset-0 bg-[var(--bg-secondary)] flex items-center justify-center z-10 px-4">
            {isWalletLoading || isLoadingChannels ? (
              <div className="text-[var(--text-dim)] font-mono text-[0.8rem] flex items-center gap-2">
                <LoadingIcon size={14} className="animate-spin opacity-70" />
                <span className="animate-pulse">
                  {isWalletLoading
                    ? "Connecting Wallet..."
                    : "Loading Channels..."}
                </span>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => handleJoinChannel(channelSlug!)}
                disabled={isLoading}
                className="w-full bg-[var(--primary)] border-none text-[var(--bg-primary)] py-2 font-mono text-[0.85rem] font-bold cursor-pointer transition-all hover:bg-[var(--primary)] disabled:opacity-50"
              >
                {isLoading ? "Joining..." : `Join #${channelSlug}`}
              </button>
            )}
          </div>
        )}
        <div className="text-[var(--color-channel)] text-[0.8rem] sm:text-[0.9rem] shrink-0 font-mono">
          {currentChannel ? `#${currentChannel.slug}>` : ">"}
        </div>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            isConnected ? "Type a message or /help" : "Connect wallet to chat"
          }
          disabled={isLoading}
          className="flex-1 bg-transparent border-none text-[var(--color-content)] font-mono text-[11px] sm:text-[13px] outline-none caret-[var(--primary)] placeholder:text-[var(--text-dim)] disabled:opacity-50"
          autoComplete="off"
          spellCheck="false"
        />
        {isLoading && !showJoinButton && (
          <div className="text-[var(--color-action)] animate-[blink_1s_infinite]">
            ...
          </div>
        )}
        {!isLoading && !showJoinButton && isConnected && (
          <button
            ref={sendButtonRef}
            type="submit"
            className="shrink-0 p-1 text-[var(--primary)] transition-opacity hover:opacity-80"
            aria-label={input.trim() ? "Send message" : "Show help"}
            title={input.trim() ? "Send message" : "Show help"}
          >
            <SendIcon size={22} />
          </button>
        )}
      </form>
    </div>
  );
}
