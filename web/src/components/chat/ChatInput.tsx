"use client";

import { type ChannelInfo } from "@/helpers/contracts";
import { RefObject } from "react";

export function ChatInput({
  input,
  setInput,
  handleKeyDown,
  handleSubmit,
  isLoading,
  isConnected,
  currentChannel,
  showJoinButton,
  handleJoinChannel,
  channelSlug,
  inputRef,
}: {
  input: string;
  setInput: (val: string) => void;
  handleKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  handleSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
  isConnected: boolean;
  currentChannel: ChannelInfo | null;
  showJoinButton: boolean | "" | undefined;
  handleJoinChannel: (slug: string) => Promise<void>;
  channelSlug?: string;
  inputRef: RefObject<HTMLInputElement | null>;
}) {
  return (
    <form
      className="flex items-center px-4 py-2 bg-[var(--bg-secondary)] border-t border-[var(--bg-tertiary)] gap-2 relative mb-[env(safe-area-inset-bottom)] sm:mb-0"
      onSubmit={handleSubmit}
    >
      {showJoinButton && (
        <div className="absolute inset-0 bg-[var(--bg-secondary)] flex items-center justify-center z-10 px-4">
          <button
            type="button"
            onClick={() => handleJoinChannel(channelSlug!)}
            disabled={isLoading}
            className="w-full bg-[var(--text-primary)] border-none text-[var(--bg-primary)] py-2 font-mono text-[0.85rem] font-bold cursor-pointer transition-all hover:bg-[var(--text-primary)] disabled:opacity-50"
          >
            {isLoading ? "Joining..." : `Join #${channelSlug}`}
          </button>
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
        className="flex-1 bg-transparent border-none text-[var(--color-content)] font-mono text-[11px] sm:text-[13px] outline-none caret-[var(--text-primary)] placeholder:text-[var(--text-dim)] disabled:opacity-50"
        autoComplete="off"
        spellCheck="false"
      />
      {isLoading && !showJoinButton && (
        <div className="text-[var(--color-action)] animate-[blink_1s_infinite]">
          ...
        </div>
      )}
    </form>
  );
}
