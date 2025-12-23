"use client";

import Image from "next/image";
import AppIcon from "@/assets/app-icon.png";
import { formatNumber } from "@/helpers/format";
import { type ChannelInfo } from "@/helpers/contracts";
import { type FarcasterUserProfile } from "@/helpers/farcaster";
import { AccountDropdown } from "./AccountDropdown";

export function ChatHeader({
  currentChannel,
  isConnected,
  address,
  ownerBalance,
  onRewardsClick,
  openWalletModal,
  profiles,
}: {
  currentChannel: ChannelInfo | null;
  isConnected: boolean;
  address?: string;
  ownerBalance: bigint;
  onRewardsClick: () => void;
  openWalletModal: () => void;
  profiles: Record<string, FarcasterUserProfile | null>;
}) {
  return (
    <header className="flex justify-between items-center px-4 py-2 bg-[var(--bg-secondary)] border-b border-[var(--color-accent-dim)] shrink-0">
      <div className="flex items-center gap-2">
        <Image
          src={AppIcon}
          alt="OnChat Logo"
          width={32}
          height={32}
          className="pixelated"
        />
        <h1 className="text-xl font-bold text-[var(--color-accent)] m-0 tracking-[2px] uppercase max-sm:text-lg">
          OnChat
        </h1>
        {currentChannel && (
          <span className="text-[var(--color-channel)] text-[0.9rem] max-sm:text-[0.8rem] truncate max-w-[150px] sm:max-w-[300px]">
            #{currentChannel.slug}
          </span>
        )}
      </div>
      <div className="flex items-center gap-3">
        {isConnected && address ? (
          <>
            <button
              onClick={onRewardsClick}
              className="flex items-center gap-2 font-mono text-[0.75rem] max-md:hidden bg-transparent border-none cursor-pointer hover:opacity-80 transition-opacity"
            >
              <span className="text-[var(--text-dim)] uppercase">
                Creator Rewards:
              </span>
              <span className="text-[var(--color-accent)] font-bold">
                {formatNumber(ownerBalance, { fromDecimals: 18 })} ETH
              </span>
            </button>
            <AccountDropdown
              address={address}
              profile={profiles[address.toLowerCase()]}
              onRewardsClick={onRewardsClick}
            />
          </>
        ) : (
          <button
            className="bg-transparent border border-[var(--color-accent-dim)] text-[var(--text-primary)] px-[0.8rem] py-[0.4rem] font-mono text-[0.8rem] cursor-pointer flex items-center gap-2 transition-all hover:bg-[var(--bg-hover)] hover:border-[var(--color-accent)]"
            onClick={openWalletModal}
          >
            <div className="w-2 h-2 rounded-full bg-[var(--color-accent)] opacity-50" />
            Connect
          </button>
        )}
      </div>
    </header>
  );
}
