"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import AppIcon from "@/assets/app-icon.png";
import BaseScanIcon from "@/assets/icons/basescan.svg";
import FarcasterIcon from "@/assets/icons/farcaster.svg";
import CopyButton from "./CopyButton";
import { useChat, type ChatLine } from "@/hooks/useChat";
import { useFarcasterProfiles } from "@/hooks/useFarcasterProfiles";
import { useAppKit } from "@reown/appkit/react";
import { useEvents } from "@/context/EventContext";
import { formatAddress, formatNumber } from "@/helpers/format";
import {
  getLatestChannels,
  getOwnerBalance,
  claimOwnerBalance,
  waitForTransaction,
  type ChannelInfo,
} from "@/helpers/contracts";
import { useWalletClient } from "wagmi";
import { type FarcasterUserProfile } from "@/helpers/farcaster";

function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function ActionButtons({
  address,
  username,
}: {
  address: string;
  username?: string;
}) {
  return (
    <div className="flex items-center">
      <CopyButton
        textToCopy={address}
        className="p-1 hover:bg-[var(--bg-tertiary)] rounded transition-colors hover:opacity-70 opacity-100 transition-opacity cursor-pointer"
        iconClassName="w-3.5 h-3.5"
      />
      <a
        href={`https://basescan.org/address/${address}`}
        target="_blank"
        rel="noopener noreferrer"
        className="p-1 hover:bg-[var(--bg-tertiary)] rounded transition-colors hover:opacity-70 opacity-100 transition-opacity"
      >
        <Image
          src={BaseScanIcon}
          alt="BaseScan"
          width={14}
          height={14}
          className="w-3.5 h-3.5"
        />
      </a>
      {username && (
        <a
          href={`https://farcaster.xyz/${username}`}
          target="_blank"
          rel="noopener noreferrer"
          className="p-1 hover:bg-[var(--bg-tertiary)] rounded transition-colors hover:opacity-70 opacity-100 transition-opacity"
        >
          <Image
            src={FarcasterIcon}
            alt="Farcaster"
            width={14}
            height={14}
            className="w-3.5 h-3.5"
          />
        </a>
      )}
    </div>
  );
}

function UserDisplay({
  address,
  formattedAddress,
  profile,
  className = "",
  showFullAddress = false,
  showActions = false,
  isSidebar = false,
}: {
  address?: string;
  formattedAddress: string;
  profile?: FarcasterUserProfile | null;
  className?: string;
  showFullAddress?: boolean;
  showActions?: boolean;
  isSidebar?: boolean;
}) {
  const displayAddress =
    showFullAddress && address ? address : formattedAddress;

  if (!profile) {
    return (
      <span
        className={`inline-flex items-center gap-1 ${
          isSidebar ? "min-w-0 flex-1" : ""
        } ${className}`}
      >
        <span
          className={`text-[var(--color-nick)] ${isSidebar ? "truncate" : ""}`}
        >
          {displayAddress}
        </span>
        {showActions && address && <ActionButtons address={address} />}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 vertical-align-middle ${
        isSidebar ? "min-w-0 flex-1" : ""
      } ${className}`}
      style={{ verticalAlign: "middle" }}
    >
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
      <span
        className={`font-bold shrink-0 text-[var(--color-nick)] ${
          isSidebar ? "truncate max-w-[100px]" : ""
        }`}
      >
        @{profile.username}
      </span>
      <span className="text-[var(--text-dim)] shrink-0">-</span>
      <span
        className={`shrink-0 text-[var(--color-nick)] ${
          isSidebar ? "truncate" : ""
        }`}
      >
        {displayAddress}
      </span>
      {showActions && address && (
        <ActionButtons address={address} username={profile.username} />
      )}
    </span>
  );
}

function ChatLineComponent({
  line,
  profile,
}: {
  line: ChatLine;
  profile?: FarcasterUserProfile | null;
}) {
  const timeStr = formatTime(line.timestamp);

  switch (line.type) {
    case "system":
      return (
        <div className="chat-line text-[var(--color-system)]">
          <span className="chat-timestamp">[{timeStr}]</span>
          <span className="chat-content">{line.content}</span>
        </div>
      );
    case "error":
      return (
        <div className="chat-line text-[var(--color-error)]">
          <span className="chat-timestamp">[{timeStr}]</span>
          <span className="chat-prefix font-bold text-[var(--color-error)]">
            !
          </span>
          <span className="chat-content">{line.content}</span>
        </div>
      );
    case "info":
      return (
        <div className="chat-line text-[var(--color-info)]">
          <span className="chat-timestamp">[{timeStr}]</span>
          <span className="chat-prefix text-[var(--color-info)]">*</span>
          <span className="chat-content">{line.content}</span>
        </div>
      );
    case "action":
      return (
        <div className="chat-line text-[var(--color-action)]">
          <span className="chat-timestamp">[{timeStr}]</span>
          <span className="chat-prefix text-[var(--color-action)]">→</span>
          <span className="chat-content">{line.content}</span>
        </div>
      );
    case "command":
      return (
        <div className="chat-line text-[var(--color-content)] font-mono">
          <span className="chat-timestamp">[{timeStr}]</span>
          <span className="text-[var(--color-channel)] mr-1">
            {line.channel ? `#${line.channel}>` : ">"}
          </span>
          <span className="chat-content">{line.content}</span>
        </div>
      );
    case "message":
      return (
        <div className="chat-line chat-line-message text-[var(--text-primary)]">
          <span className="chat-timestamp">[{timeStr}]</span>
          {line.channel && (
            <span className="chat-channel">#{line.channel}</span>
          )}
          <span
            className="chat-sender inline-flex items-center gap-0"
            style={{ verticalAlign: "middle" }}
          >
            <span className="mr-[1px]">&lt;</span>
            <UserDisplay
              address={line.senderAddress}
              formattedAddress={line.sender || ""}
              profile={profile}
            />
            <span className="ml-[1px]">&gt;</span>
          </span>
          <span className="chat-content">{line.content}</span>
        </div>
      );
    case "user":
      return (
        <div className="chat-line text-[var(--color-info)] flex items-center">
          <span className="chat-timestamp">[{timeStr}]</span>
          <span className="chat-prefix text-[var(--color-info)]">*</span>
          <UserDisplay
            address={line.senderAddress}
            formattedAddress={line.sender || ""}
            profile={profile}
            showFullAddress={true}
            showActions={true}
          />
        </div>
      );
    default:
      return null;
  }
}

export default function ChatClient({ channelSlug }: { channelSlug?: string }) {
  const {
    lines,
    currentChannel,
    joinedChannels,
    members,
    moderators,
    isConnected,
    address,
    isLoading,
    isInitialChannelLoading,
    processCommand,
    enterChannel,
  } = useChat(channelSlug);

  const { open } = useAppKit();
  const { currentBlock } = useEvents();
  const { data: walletClient } = useWalletClient();

  // Fetch Farcaster profiles for all relevant addresses
  const allAddresses = [
    ...(address ? [address] : []),
    ...lines
      .filter(
        (l: ChatLine) =>
          (l.type === "message" || l.type === "user") && l.senderAddress
      )
      .map((l: ChatLine) => l.senderAddress!),
    ...members,
  ];
  const { profiles } = useFarcasterProfiles(allAddresses);

  const [input, setInput] = useState("");
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [showChannelBrowser, setShowChannelBrowser] = useState(false);
  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const [allChannels, setAllChannels] = useState<ChannelInfo[]>([]);
  const [newChannelName, setNewChannelName] = useState("");
  const [loadingChannels, setLoadingChannels] = useState(false);

  // Balance state
  const [ownerBalance, setOwnerBalance] = useState<bigint>(BigInt(0));
  const [claimingBalance, setClaimingBalance] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Check if we are in the initial channel
  const isJoinedInInitialChannel =
    channelSlug &&
    joinedChannels.some((c) => c.slug === channelSlug.toLowerCase());
  const showJoinButton =
    channelSlug &&
    !isJoinedInInitialChannel &&
    !isInitialChannelLoading &&
    currentChannel?.slug === channelSlug.toLowerCase();

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [lines]);

  // Focus input on mount and after loading completes
  useEffect(() => {
    inputRef.current?.focus();
  }, [isLoading]);

  // Update URL when channel changes
  useEffect(() => {
    if (currentChannel?.slug) {
      const newPath = `/${currentChannel.slug}`;
      if (window.location.pathname !== newPath) {
        window.history.pushState({}, "", newPath);
      }
    } else if (currentChannel === null && window.location.pathname !== "/") {
      window.history.pushState({}, "", "/");
    }
  }, [currentChannel]);

  // Handle browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      const slug = path.split("/").filter(Boolean)[0];
      enterChannel(slug || null);
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [enterChannel]);

  // Load balance data
  const loadBalanceData = useCallback(async () => {
    if (!address) {
      setOwnerBalance(BigInt(0));
      return;
    }

    try {
      const balance = await getOwnerBalance(address as `0x${string}`);
      setOwnerBalance(balance);
    } catch (err) {
      console.error("Failed to load balance data:", err);
    }
  }, [address]);

  // Load balance on mount and when address/block changes
  useEffect(() => {
    loadBalanceData();
  }, [loadBalanceData, currentBlock]);

  // Claim handler
  const handleClaim = async () => {
    if (!walletClient) return;

    setClaimingBalance(true);
    try {
      const tx = await claimOwnerBalance(walletClient);
      await waitForTransaction(tx);
      await loadBalanceData();
    } catch (err) {
      console.error("Failed to claim:", err);
    }
    setClaimingBalance(false);
  };

  // Load all channels when browser opens
  const loadAllChannels = useCallback(async () => {
    setLoadingChannels(true);
    try {
      const channels = await getLatestChannels(0, 50);
      setAllChannels(channels);
    } catch (err) {
      console.error("Failed to load channels:", err);
    }
    setLoadingChannels(false);
  }, []);

  useEffect(() => {
    if (showChannelBrowser) {
      // Defer to avoid synchronous setState in effect
      const timeoutId = setTimeout(() => {
        loadAllChannels();
      }, 0);
      return () => clearTimeout(timeoutId);
    }
  }, [showChannelBrowser, loadAllChannels]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!input.trim() || isLoading) return;

      const command = input;
      setInput("");
      setHistoryIndex(-1);
      setCommandHistory((prev) => [command, ...prev.slice(0, 99)]);

      await processCommand(command);
      inputRef.current?.focus();
    },
    [input, isLoading, processCommand]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "ArrowUp") {
        e.preventDefault();
        if (historyIndex < commandHistory.length - 1) {
          const newIndex = historyIndex + 1;
          setHistoryIndex(newIndex);
          setInput(commandHistory[newIndex]);
        }
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        if (historyIndex > 0) {
          const newIndex = historyIndex - 1;
          setHistoryIndex(newIndex);
          setInput(commandHistory[newIndex]);
        } else if (historyIndex === 0) {
          setHistoryIndex(-1);
          setInput("");
        }
      }
    },
    [historyIndex, commandHistory]
  );

  const handleJoinChannel = useCallback(
    async (slug: string) => {
      setShowChannelBrowser(false);
      await processCommand(`/join #${slug}`);
    },
    [processCommand]
  );

  const handleCreateChannel = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!newChannelName.trim()) return;

      const slug = newChannelName.toLowerCase().replace(/[^a-z-]/g, "");
      if (!slug) return;

      setShowCreateChannel(false);
      setNewChannelName("");
      await processCommand(`/create #${slug}`);
    },
    [newChannelName, processCommand]
  );

  return (
    <div className="flex flex-col h-screen max-h-screen overflow-hidden chat-container">
      {/* Header */}
      <header className="flex justify-between items-center px-4 py-2 bg-[var(--bg-secondary)] border-b border-[var(--color-accent-dim)] shrink-0">
        <div className="flex items-center gap-2">
          <Image
            src={AppIcon}
            alt="OnChat Logo"
            width={32}
            height={32}
            className="pixelated"
          />
          <h1 className="text-xl font-bold text-[var(--color-accent)] m-0 tracking-[2px] uppercase">
            OnChat
          </h1>
          {currentChannel && (
            <span className="text-[var(--color-channel)] text-[0.9rem]">
              #{currentChannel.slug}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {/* Claimable balance */}
          {isConnected && address && ownerBalance > BigInt(0) && (
            <div className="flex items-center gap-2 px-[10px] py-1 bg-[var(--bg-tertiary)] border border-[var(--color-accent-dim)] rounded font-mono text-[0.8rem]">
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

          {/* Wallet connection */}
          <button
            className={`bg-transparent border border-[var(--color-accent-dim)] ${
              isConnected && address
                ? "text-[var(--color-accent)]"
                : "text-[var(--text-primary)]"
            } px-[0.8rem] py-[0.4rem] font-mono text-[0.8rem] cursor-pointer flex items-center gap-2 transition-all hover:bg-[var(--bg-hover)] hover:border-[var(--color-accent)]`}
            onClick={() => open()}
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
              "Connect Wallet"
            )}
          </button>
        </div>
      </header>

      {/* Main content */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-[220px] bg-[var(--bg-secondary)] border-r border-[var(--bg-tertiary)] flex flex-col shrink-0 overflow-hidden max-md:w-[180px] max-sm:hidden">
          {/* Action buttons */}
          <div className="flex gap-2 p-2 border-b border-[var(--bg-tertiary)]">
            <button
              className="flex-1 bg-transparent border border-[var(--color-accent-dim)] text-[var(--color-accent)] px-2 py-[0.4rem] font-mono text-[0.7rem] cursor-pointer transition-all hover:not-disabled:bg-[var(--color-accent-dim)] hover:not-disabled:text-[var(--bg-primary)] disabled:opacity-40 disabled:cursor-not-allowed"
              onClick={() => setShowChannelBrowser(true)}
              title="Browse channels"
            >
              + Join
            </button>
            <button
              className="flex-1 bg-transparent border border-[var(--color-accent-dim)] text-[var(--color-accent)] px-2 py-[0.4rem] font-mono text-[0.7rem] cursor-pointer transition-all hover:not-disabled:bg-[var(--color-accent-dim)] hover:not-disabled:text-[var(--bg-primary)] disabled:opacity-40 disabled:cursor-not-allowed"
              onClick={() => setShowCreateChannel(true)}
              title="Create channel"
              disabled={!isConnected}
            >
              + New
            </button>
          </div>

          {/* Channels */}
          <div className="p-3 border-b border-[var(--bg-tertiary)] overflow-hidden flex flex-col">
            <h3 className="text-[0.7rem] uppercase text-[var(--text-muted)] mb-2 tracking-[1px] m-0">
              My Channels
            </h3>
            <ul className="list-none p-0 m-0 overflow-y-auto flex-1">
              {joinedChannels.length > 0 ? (
                joinedChannels.map((channel) => (
                  <li
                    key={channel.slug}
                    className={`px-2 py-1 cursor-pointer text-[0.8rem] text-[var(--text-secondary)] whitespace-nowrap overflow-hidden text-ellipsis hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] ${
                      currentChannel?.slug === channel.slug
                        ? "bg-[var(--bg-tertiary)] text-[var(--color-channel)] border-l-2 border-[var(--color-channel)] !pl-[calc(0.5rem-2px)]"
                        : ""
                    }`}
                    onClick={() => processCommand(`/join #${channel.slug}`)}
                  >
                    <span className="text-[var(--text-muted)]">#</span>
                    {channel.slug}
                    <span className="ml-1 text-[0.75rem]">
                      ({channel.memberCount.toString()})
                    </span>
                  </li>
                ))
              ) : (
                <li className="text-[var(--text-dim)] italic cursor-default px-2 py-1 text-[0.8rem]">
                  No channels joined
                </li>
              )}
            </ul>
          </div>

          {/* Users */}
          {currentChannel && (
            <div className="p-3 border-b border-[var(--bg-tertiary)] overflow-hidden flex flex-col">
              <h3 className="text-[0.7rem] uppercase text-[var(--text-muted)] mb-2 tracking-[1px] m-0">
                Users ({members.length})
              </h3>
              <ul className="list-none p-0 m-0 overflow-y-auto flex-1">
                {members.map((member: string) => {
                  const isOwner =
                    currentChannel.owner.toLowerCase() === member.toLowerCase();
                  const isModerator = moderators.some(
                    (m: string) => m.toLowerCase() === member.toLowerCase()
                  );
                  const profile = profiles[member.toLowerCase()];
                  return (
                    <li
                      key={member}
                      className="px-2 py-1 cursor-pointer text-[0.8rem] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] flex items-center min-w-0"
                    >
                      {isOwner && (
                        <span className="mr-1 text-[0.7rem] text-[var(--color-action)] shrink-0">
                          (owner)
                        </span>
                      )}
                      {!isOwner && isModerator && (
                        <span className="mr-1 text-[0.7rem] text-[var(--color-action)] shrink-0">
                          (mode)
                        </span>
                      )}
                      <UserDisplay
                        address={member}
                        formattedAddress={formatAddress(member)}
                        profile={profile}
                        showActions={true}
                        isSidebar={true}
                      />
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </aside>

        {/* Messages */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
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
                />
              ))}
            </div>
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form
            className="flex items-center px-4 py-2 bg-[var(--bg-secondary)] border-t border-[var(--bg-tertiary)] gap-2 relative"
            onSubmit={handleSubmit}
          >
            {showJoinButton && (
              <div className="absolute inset-0 bg-[var(--bg-secondary)] flex items-center justify-center z-10 px-4">
                <button
                  type="button"
                  onClick={() => handleJoinChannel(channelSlug!)}
                  disabled={isLoading}
                  className="w-full bg-[var(--color-accent)] border-none text-[var(--bg-primary)] py-2 font-mono text-[0.85rem] font-bold cursor-pointer transition-all hover:bg-[var(--text-primary)] disabled:opacity-50"
                >
                  {isLoading ? "Joining..." : `Join #${channelSlug}`}
                </button>
              </div>
            )}
            <div className="text-[var(--color-channel)] text-[0.9rem] shrink-0 font-mono">
              {currentChannel ? `#${currentChannel.slug}>` : ">"}
            </div>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                isConnected
                  ? "Type a message or /help"
                  : "Connect wallet to chat"
              }
              disabled={isLoading}
              className="flex-1 bg-transparent border-none text-[var(--color-content)] font-mono text-[13px] outline-none caret-[var(--color-accent)] placeholder:text-[var(--text-dim)] disabled:opacity-50"
              autoComplete="off"
              spellCheck="false"
            />
            {isLoading && !showJoinButton && (
              <div className="text-[var(--color-action)] animate-[blink_1s_infinite]">
                ...
              </div>
            )}
          </form>
        </div>
      </div>

      {/* Status bar */}
      <footer className="flex items-center px-4 py-1 bg-[var(--bg-tertiary)] border-t border-[var(--bg-hover)] text-[0.75rem] text-[var(--text-muted)] shrink-0 gap-2 font-mono max-sm:px-2 max-sm:text-[0.65rem]">
        <span className="flex items-center gap-[0.4rem]">
          {isConnected ? (
            <>
              <div className="w-[6px] h-[6px] rounded-full bg-[var(--color-accent)]" />
              Base Network
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
          <>
            <span className="text-[var(--text-dim)]">|</span>
            <span className="flex items-center gap-[0.4rem]">
              {currentChannel.memberCount.toString()} users
            </span>
            <span className="text-[var(--text-dim)]">|</span>
            <span className="flex items-center gap-[0.4rem]">
              {currentChannel.messageCount.toString()} messages
            </span>
          </>
        )}
        <span className="ml-auto text-[var(--text-dim)] max-sm:hidden">
          Fully on-chain • Permissionless
        </span>
      </footer>

      {/* Channel Browser Modal */}
      {showChannelBrowser && (
        <div
          className="fixed inset-0 bg-black/85 flex items-center justify-center z-[10000] animate-[fadeIn_0.15s_ease-out]"
          onClick={() => setShowChannelBrowser(false)}
        >
          <div
            className="bg-[var(--bg-secondary)] border border-[var(--color-accent-dim)] w-[90%] max-w-[400px] max-h-[80vh] flex flex-col animate-[modalSlideIn_0.2s_ease-out]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center px-4 py-3 border-b border-[var(--bg-tertiary)]">
              <h2 className="m-0 text-[0.9rem] text-[var(--color-accent)] uppercase tracking-[1px] font-mono font-bold">
                Browse Channels
              </h2>
              <button
                className="bg-transparent border-none text-[var(--text-muted)] text-2xl cursor-pointer leading-none p-0 hover:text-[var(--color-error)]"
                onClick={() => setShowChannelBrowser(false)}
              >
                ×
              </button>
            </div>
            <div className="p-4 overflow-y-auto flex-1 font-mono">
              {loadingChannels ? (
                <div className="text-[var(--text-muted)] text-center py-8 text-[0.85rem]">
                  Loading channels...
                </div>
              ) : allChannels.length === 0 ? (
                <div className="text-[var(--text-muted)] text-center py-8 text-[0.85rem]">
                  No channels yet. Be the first to create one!
                </div>
              ) : (
                <ul className="list-none p-0 m-0">
                  {allChannels.map((ch) => (
                    <li
                      key={ch.slugHash}
                      className="flex items-center justify-between py-2 border-b border-[var(--bg-tertiary)] last:border-none"
                    >
                      <div className="flex flex-col gap-1">
                        <span className="text-[var(--color-channel)] text-[0.9rem]">
                          #{ch.slug}
                        </span>
                        <span className="text-[var(--text-muted)] text-[0.7rem]">
                          {ch.memberCount.toString()} users •{" "}
                          {ch.messageCount.toString()} msgs
                        </span>
                      </div>
                      <button
                        className="bg-transparent border border-[var(--color-accent-dim)] text-[var(--color-accent)] px-3 py-1 font-mono text-[0.75rem] cursor-pointer transition-all hover:not-disabled:bg-[var(--color-accent)] hover:not-disabled:text-[var(--bg-primary)] disabled:opacity-40 disabled:cursor-not-allowed"
                        onClick={() => handleJoinChannel(ch.slug)}
                        disabled={!isConnected || isLoading}
                      >
                        {joinedChannels.some((c) => c.slug === ch.slug)
                          ? "Enter"
                          : "Join"}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create Channel Modal */}
      {showCreateChannel && (
        <div
          className="fixed inset-0 bg-black/85 flex items-center justify-center z-[10000] animate-[fadeIn_0.15s_ease-out]"
          onClick={() => setShowCreateChannel(false)}
        >
          <div
            className="bg-[var(--bg-secondary)] border border-[var(--color-accent-dim)] w-[90%] max-w-[400px] max-h-[80vh] flex flex-col animate-[modalSlideIn_0.2s_ease-out]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center px-4 py-3 border-b border-[var(--bg-tertiary)]">
              <h2 className="m-0 text-[0.9rem] text-[var(--color-accent)] uppercase tracking-[1px] font-mono font-bold">
                Create Channel
              </h2>
              <button
                className="bg-transparent border-none text-[var(--text-muted)] text-2xl cursor-pointer leading-none p-0 hover:text-[var(--color-error)]"
                onClick={() => setShowCreateChannel(false)}
              >
                ×
              </button>
            </div>
            <div className="p-4 overflow-y-auto flex-1 font-mono">
              {!isConnected ? (
                <div className="text-[var(--text-muted)] text-center py-8 text-[0.85rem]">
                  Connect your wallet to create a channel
                </div>
              ) : (
                <form
                  onSubmit={handleCreateChannel}
                  className="flex flex-col gap-3"
                >
                  <label
                    htmlFor="channel-name"
                    className="text-[0.75rem] text-[var(--text-muted)] uppercase tracking-[1px]"
                  >
                    Channel Name
                  </label>
                  <div className="flex items-center bg-[var(--bg-primary)] border border-[var(--bg-tertiary)]">
                    <span className="text-[var(--color-channel)] px-2 text-base">
                      #
                    </span>
                    <input
                      id="channel-name"
                      type="text"
                      value={newChannelName}
                      onChange={(e) =>
                        setNewChannelName(
                          e.target.value.toLowerCase().replace(/[^a-z-]/g, "")
                        )
                      }
                      placeholder="my-channel"
                      maxLength={20}
                      autoFocus
                      className="flex-1 bg-transparent border-none text-[var(--text-primary)] font-mono text-[0.9rem] py-2 outline-none placeholder:text-[var(--text-dim)]"
                    />
                  </div>
                  <p className="text-[0.7rem] text-[var(--text-dim)] m-0">
                    Lowercase letters and hyphens only, max 20 chars
                  </p>
                  <button
                    type="submit"
                    className="bg-[var(--color-accent)] border-none text-[var(--bg-primary)] py-2 px-4 font-mono text-[0.85rem] font-bold cursor-pointer transition-all hover:not-disabled:bg-[var(--text-primary)] disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                    disabled={!newChannelName.trim() || isLoading}
                  >
                    {isLoading ? "Creating..." : "Create Channel"}
                  </button>
                  <p className="text-[0.7rem] text-[var(--text-dim)] text-center m-0">
                    Creating a channel requires a small ETH fee
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
