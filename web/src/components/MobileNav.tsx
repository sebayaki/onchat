"use client";

import { ChatIcon, ChannelIcon, RewardIcon } from "@/components/Icons";

export function MobileNav({
  activeTab,
  setActiveTab,
  messageCount,
}: {
  activeTab: "chat" | "channels" | "rewards";
  setActiveTab: (tab: "chat" | "channels" | "rewards") => void;
  messageCount?: bigint;
}) {
  return (
    <nav className="sm:hidden flex items-center justify-around bg-[var(--bg-secondary)] border-t border-[var(--bg-tertiary)] py-2 px-1">
      <button
        onClick={() => setActiveTab("channels")}
        className={`flex flex-col items-center gap-1 bg-transparent border-none cursor-pointer ${
          activeTab === "channels"
            ? "text-[var(--primary)]"
            : "text-[var(--text-dim)]"
        }`}
      >
        <ChannelIcon
          size={20}
          className={`${activeTab === "channels" ? "" : "opacity-50"}`}
        />
        <span className="text-[0.65rem] uppercase font-bold tracking-[1px]">
          Channels
        </span>
      </button>
      <button
        onClick={() => setActiveTab("chat")}
        className={`flex flex-col items-center gap-1 bg-transparent border-none cursor-pointer relative ${
          activeTab === "chat"
            ? "text-[var(--primary)]"
            : "text-[var(--text-dim)]"
        }`}
      >
        <div className="relative">
          <ChatIcon
            size={20}
            className={`${activeTab === "chat" ? "" : "opacity-50"}`}
          />
          {messageCount !== undefined && messageCount > BigInt(0) && (
            <div className="absolute -top-1.5 -right-2.5 bg-[var(--primary)] text-[var(--bg-primary)] text-[10px] font-bold px-1 min-w-[14px] h-[14px] rounded-full flex items-center justify-center border border-[var(--bg-secondary)]">
              {messageCount > BigInt(99) ? "99+" : messageCount.toString()}
            </div>
          )}
        </div>
        <span className="text-[0.65rem] uppercase font-bold tracking-[1px]">
          Chat
        </span>
      </button>
      <button
        onClick={() => setActiveTab("rewards")}
        className={`flex flex-col items-center gap-1 bg-transparent border-none cursor-pointer ${
          activeTab === "rewards"
            ? "text-[var(--primary)]"
            : "text-[var(--text-dim)]"
        }`}
      >
        <RewardIcon
          size={20}
          className={`${activeTab === "rewards" ? "" : "opacity-50"}`}
        />
        <span className="text-[0.65rem] uppercase font-bold tracking-[1px]">
          Rewards
        </span>
      </button>
    </nav>
  );
}
