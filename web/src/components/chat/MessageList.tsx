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
}: {
  lines: ChatLine[];
  profiles: Record<string, FarcasterUserProfile | null>;
  messagesEndRef: RefObject<HTMLDivElement | null>;
  isModerator: boolean;
  processCommand: (input: string) => Promise<void>;
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
      </div>
      <div ref={messagesEndRef} />
    </div>
  );
}
