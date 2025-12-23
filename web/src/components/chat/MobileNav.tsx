"use client";

import Image from "next/image";
import ChatIcon from "@/assets/icons/chat.svg";
import ChannelIcon from "@/assets/icons/channel.svg";
import RewardIcon from "@/assets/icons/reward.svg";

export function MobileNav({
  activeTab,
  setActiveTab,
}: {
  activeTab: "chat" | "channels" | "rewards";
  setActiveTab: (tab: "chat" | "channels" | "rewards") => void;
}) {
  return (
    <nav className="sm:hidden flex items-center justify-around bg-[var(--bg-secondary)] border-t border-[var(--bg-tertiary)] py-2 px-1 pb-[calc(0.5rem+env(safe-area-inset-bottom))]">
      <button
        onClick={() => setActiveTab("channels")}
        className={`flex flex-col items-center gap-1 bg-transparent border-none cursor-pointer ${
          activeTab === "channels"
            ? "text-[var(--text-primary)]"
            : "text-[var(--text-dim)]"
        }`}
      >
        <Image
          src={ChannelIcon}
          alt="Channels"
          width={20}
          height={20}
          className={`w-5 h-5 ${activeTab === "channels" ? "" : "opacity-50"}`}
        />
        <span className="text-[0.65rem] uppercase font-bold tracking-[1px]">
          Channels
        </span>
      </button>
      <button
        onClick={() => setActiveTab("chat")}
        className={`flex flex-col items-center gap-1 bg-transparent border-none cursor-pointer ${
          activeTab === "chat"
            ? "text-[var(--text-primary)]"
            : "text-[var(--text-dim)]"
        }`}
      >
        <Image
          src={ChatIcon}
          alt="Chat"
          width={20}
          height={20}
          className={`w-5 h-5 ${activeTab === "chat" ? "" : "opacity-50"}`}
        />
        <span className="text-[0.65rem] uppercase font-bold tracking-[1px]">
          Chat
        </span>
      </button>
      <button
        onClick={() => setActiveTab("rewards")}
        className={`flex flex-col items-center gap-1 bg-transparent border-none cursor-pointer ${
          activeTab === "rewards"
            ? "text-[var(--text-primary)]"
            : "text-[var(--text-dim)]"
        }`}
      >
        <Image
          src={RewardIcon}
          alt="Rewards"
          width={20}
          height={20}
          className={`w-5 h-5 ${activeTab === "rewards" ? "" : "opacity-50"}`}
        />
        <span className="text-[0.65rem] uppercase font-bold tracking-[1px]">
          Rewards
        </span>
      </button>
    </nav>
  );
}
