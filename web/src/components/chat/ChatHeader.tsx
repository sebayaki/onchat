"use client";

import Image from "next/image";
import AppIcon from "@/assets/app-icon.png";
import { formatAddress, formatNumber } from "@/helpers/format";
import { type ChannelInfo } from "@/helpers/contracts";
import { type FarcasterUserProfile } from "@/helpers/farcaster";
import { UserDisplay } from "./ChatLine";

export function ChatHeader({
  currentChannel,
  isConnected,
  address,
  ownerBalance,
  claimingBalance,
  handleClaim,
  openWalletModal,
  profiles,
}: {
  currentChannel: ChannelInfo | null;
  isConnected: boolean;
  address?: string;
  ownerBalance: bigint;
  claimingBalance: boolean;
  handleClaim: () => Promise<void>;
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
          <span className="text-[var(--color-channel)] text-[0.9rem] max-sm:text-[0.8rem] truncate max-w-[100px]">
            #{currentChannel.slug}
          </span>
        )}
      </div>
      <div className="flex items-center gap-3">
        {/* Claimable balance - Hidden on mobile header, moved to rewards tab */}
        {isConnected && address && ownerBalance > BigInt(0) && (
          <div className="flex items-center gap-2 px-[10px] py-1 bg-[var(--bg-tertiary)] border border-[var(--color-accent-dim)] rounded font-mono text-[0.8rem] max-md:hidden">
            <span className="text-[var(--text-dim)]">Creator Rewards:</span>
            <span className="text-[var(--color-accent)] font-medium">
              {formatNumber(ownerBalance, { fromDecimals: 18 })} ETH
            </span>
            <button
              className="bg-[var(--color-accent)] text-[var(--bg-primary)] border-none px-2 py-[2px] text-[0.75rem] font-mono cursor-pointer rounded-sm font-semibold hover:not-disabled:bg-[var(--text-primary)] disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleClaim}
              disabled={claimingBalance}
            >
              {claimingBalance ? "..." : "Claim"}
            </button>
          </div>
        )}

        {/* Wallet connection - Hidden on mobile header, moved to mobile nav or rewards */}
        <button
          className={`bg-transparent border border-[var(--color-accent-dim)] ${
            isConnected && address
              ? "text-[var(--color-accent)]"
              : "text-[var(--text-primary)]"
          } px-[0.8rem] py-[0.4rem] font-mono text-[0.8rem] cursor-pointer flex items-center gap-2 transition-all hover:bg-[var(--bg-hover)] hover:border-[var(--color-accent)] max-sm:hidden`}
          onClick={openWalletModal}
        >
          <div
            className={`w-2 h-2 rounded-full bg-[var(--color-accent)] ${
              isConnected ? "animate-pulse" : "opacity-50"
            }`}
          />
          {isConnected && address ? (
            <UserDisplay
              address={address}
              formattedAddress={formatAddress(address)}
              profile={profiles[address.toLowerCase()]}
            />
          ) : (
            "Connect"
          )}
        </button>
      </div>
    </header>
  );
}
