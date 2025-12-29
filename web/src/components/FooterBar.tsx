"use client";

import { type ChannelInfo } from "@/helpers/contracts";
import pkg from "../../package.json";

export function FooterBar({
  isConnected,
  currentBlock,
  currentChannel,
}: {
  isConnected: boolean;
  currentBlock: bigint;
  currentChannel: ChannelInfo | null;
}) {
  return (
    <footer className="flex sm:flex items-center px-4 pt-1 pb-[calc(0.25rem+env(safe-area-inset-bottom))] bg-[var(--bg-tertiary)] border-t border-[var(--bg-hover)] text-[0.75rem] text-[var(--primary-muted)] shrink-0 gap-2 font-mono">
      <span className="flex items-center gap-[0.4rem]">
        {isConnected ? (
          <>
            <div className="w-[6px] h-[6px] rounded-full bg-[var(--primary)] status-dot-animated" />
            Base
            {currentBlock > BigInt(0) && (
              <span className="ml-1 text-[#eee] text-[0.85em]">
                ({currentBlock.toLocaleString()})
              </span>
            )}
          </>
        ) : (
          <>
            <div className="w-[6px] h-[6px] rounded-full bg-[var(--color-error)]" />
            Disconnected
          </>
        )}
      </span>
      {currentChannel && (
        <span className="hidden sm:flex items-center gap-2">
          <span className="text-[var(--text-dim)]">|</span>
          <span className="flex items-center gap-[0.4rem]">
            {currentChannel.memberCount.toString()} users
          </span>
          <span className="text-[var(--text-dim)]">|</span>
          <span className="flex items-center gap-[0.4rem]">
            {currentChannel.messageCount.toString()} messages
          </span>
        </span>
      )}
      <span className="ml-auto text-[var(--text-dim)]">
        <span className="hidden sm:inline">
          Fully on-chain • Permissionless |{" "}
        </span>
        v{pkg.version}
      </span>
    </footer>
  );
}
