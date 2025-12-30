"use client";

import { type ChatLine } from "@/hooks/useChat";
import { type FarcasterUserProfile } from "@/helpers/farcaster";
import { ChatLineComponent } from "./ChatLine";
import { RefObject } from "react";

export function MessageList({
  lines,
  profiles,
  messagesEndRef,
  isModerator,
  processCommand,
  showChannelButtons,
  onBrowseChannels,
  onCreateChannel,
}: {
  lines: ChatLine[];
  profiles: Record<string, FarcasterUserProfile | null>;
  messagesEndRef: RefObject<HTMLDivElement | null>;
  isModerator: boolean;
  processCommand: (input: string) => Promise<void>;
  showChannelButtons?: boolean;
  onBrowseChannels?: () => void;
  onCreateChannel?: () => void;
}) {
  return (
    <div className="flex-1 overflow-y-auto px-4 py-2 bg-[var(--bg-primary)] scrollbar-thin scrollbar-track-transparent scrollbar-thumb-[var(--bg-tertiary)] hover:scrollbar-thumb-[var(--bg-hover)]">
      <div className="flex flex-col gap-[2px]">
        {lines.map((line: ChatLine) => (
          <ChatLineComponent
            key={line.id}
            line={line}
            profile={
              line.senderAddress
                ? profiles[line.senderAddress.toLowerCase()]
                : null
            }
            isModerator={isModerator}
            processCommand={processCommand}
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
