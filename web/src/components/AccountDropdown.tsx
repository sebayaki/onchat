"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { useDisconnect } from "wagmi";
import { MenuIcon } from "@/components/Icons";
import { formatAddress } from "@/helpers/format";
import { type FarcasterUserProfile } from "@/helpers/farcaster";
import CopyButton from "./CopyButton";

export function AccountDropdown({
  address,
  profile,
  onRewardsClick,
  isMobileNav = false,
}: {
  address: string;
  profile?: FarcasterUserProfile | null;
  onRewardsClick: () => void;
  isMobileNav?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { disconnect } = useDisconnect();

  const formattedAddress = formatAddress(address);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`${
          isMobileNav
            ? "bg-transparent border-none p-0 flex items-center justify-center"
            : "bg-transparent border border-[var(--primary-muted)] text-[var(--primary)] px-[0.8rem] py-[0.4rem] font-mono text-[0.8rem] cursor-pointer flex items-center gap-2 transition-all hover:bg-[var(--bg-hover)] hover:border-[var(--primary)]"
        }`}
      >
        {isMobileNav ? (
          <MenuIcon size={24} className="text-[var(--primary)]" />
        ) : (
          <>
            {profile ? (
              <div className="flex items-center gap-1.5">
                {profile.pfpUrl && (
                  <Image
                    src={profile.pfpUrl}
                    alt={profile.username}
                    width={16}
                    height={16}
                    className="w-4 h-4 rounded-full shrink-0"
                    unoptimized
                  />
                )}
                <span className="font-bold">@{profile.username}</span>
              </div>
            ) : (
              <span>{formattedAddress}</span>
            )}
            <MenuIcon size={16} className="opacity-70" />
          </>
        )}
      </button>

      {isOpen && (
        <div
          className={`absolute ${
            isMobileNav ? "bottom-full right-[-10px] mb-2" : "right-0 mt-2"
          } w-56 bg-[var(--bg-secondary)] border border-[var(--primary-muted)] rounded-sm shadow-2xl z-[10001] overflow-hidden font-mono`}
        >
          {/* Profile Header */}
          <div className="p-3 border-b border-[var(--primary-muted)] bg-[var(--bg-tertiary)]/30">
            <div className="flex items-center gap-2.5">
              <div className="relative w-8 h-8 rounded-full overflow-hidden bg-[var(--bg-primary)] border border-[var(--primary-muted)] shrink-0">
                {profile?.pfpUrl ? (
                  <Image
                    src={profile.pfpUrl}
                    alt={profile.username}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[var(--text-dim)] text-[0.6rem]">
                    ?
                  </div>
                )}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-bold text-[var(--primary)] text-[0.85rem] truncate leading-tight">
                  {profile ? `@${profile.username}` : "Anonymous"}
                </span>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="text-[var(--text-dim)] text-[0.65rem]">
                    {formattedAddress}
                  </span>
                  <CopyButton
                    textToCopy={address}
                    className="p-0.5 hover:bg-[var(--bg-hover)] rounded text-[var(--text-dim)] hover:text-[var(--primary)] transition-all"
                    iconClassName="w-2.5 h-2.5"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="bg-[var(--bg-secondary)] py-1">
            <button
              onClick={() => {
                onRewardsClick();
                setIsOpen(false);
              }}
              className="w-full text-left px-3 py-2 text-[0.75rem] hover:bg-[var(--bg-hover)] text-[var(--primary)] transition-colors flex justify-between items-center cursor-pointer group"
            >
              <span className="group-hover:translate-x-0.5 transition-transform">
                Creator Rewards
              </span>
            </button>

            <div className="h-[1px] bg-[var(--primary-muted)]/20 my-1 mx-3" />

            <button
              onClick={() => {
                disconnect();
                setIsOpen(false);
              }}
              className="w-full text-left px-3 py-2 text-[0.75rem] hover:bg-[var(--bg-hover)] text-[var(--primary)] transition-colors cursor-pointer group"
            >
              <span className="group-hover:translate-x-0.5 transition-transform">
                Disconnect
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
