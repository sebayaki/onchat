"use client";

import { ShareIcon, LogoIcon } from "@/components/Icons";
import { formatNumber } from "@/helpers/format";
import { type ChannelInfo } from "@/helpers/contracts";
import { type FarcasterUserProfile } from "@/helpers/farcaster";
import { AccountDropdown } from "./AccountDropdown";

export function Header({
  currentChannel,
  isConnected,
  address,
  ownerBalance,
  onRewardsClick,
  openWalletModal,
  profiles,
  onShareClick,
  hideBrand,
  onBrandClick,
}: {
  currentChannel: ChannelInfo | null;
  isConnected: boolean;
  address?: string;
  ownerBalance: bigint;
  onRewardsClick: () => void;
  openWalletModal: () => void;
  profiles: Record<string, FarcasterUserProfile | null>;
  onShareClick: () => void;
  hideBrand?: boolean;
  onBrandClick: () => void;
}) {
  return (
    <header className="flex justify-between items-center px-4 py-2 bg-[var(--bg-secondary)] border-b border-[var(--primary-muted)] shrink-0">
      <div className="flex items-center gap-2 overflow-hidden">
        <button
          onClick={onBrandClick}
          className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity bg-transparent border-none p-0 m-0"
        >
          <LogoIcon size={32} className="text-[var(--primary)] shrink-0" />
          {!hideBrand && (
            <h1 className="text-xl font-bold text-[var(--primary)] m-0 tracking-[2px] uppercase max-sm:text-lg shrink-0">
              OnChat
            </h1>
          )}
        </button>
        <div className="flex items-center gap-2 min-w-0">
          {currentChannel && (
            <span className="text-[var(--color-channel)] text-[0.9rem] max-sm:text-[0.8rem] truncate max-w-[150px] sm:max-w-[300px]">
              #{currentChannel.slug}
            </span>
          )}
          <button
            onClick={onShareClick}
            className="bg-transparent border-none p-1 cursor-pointer hover:opacity-80 transition-opacity flex items-center justify-center shrink-0 group"
            title={currentChannel ? "Share Channel" : "Share App"}
          >
            <ShareIcon size={16} className="text-[var(--primary)]" />
          </button>
        </div>
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
              <span className="text-[var(--primary)] font-bold">
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
            className="bg-transparent border border-[var(--primary-muted)] text-[var(--primary)] px-[0.8rem] py-[0.4rem] font-mono text-[0.8rem] cursor-pointer flex items-center gap-2 transition-all hover:bg-[var(--bg-hover)] hover:border-[var(--primary)]"
            onClick={openWalletModal}
          >
            <div className="w-2 h-2 rounded-full bg-[var(--primary)] opacity-50" />
            Connect
          </button>
        )}
      </div>
    </header>
  );
}
