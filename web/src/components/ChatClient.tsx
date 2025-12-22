"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useChat, type ChatLine } from "@/hooks/useChat";
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

function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function ChatLineComponent({ line }: { line: ChatLine }) {
  const timeStr = formatTime(line.timestamp);

  switch (line.type) {
    case "system":
      return (
        <div className="chat-line system">
          <span className="timestamp">[{timeStr}]</span>
          <span className="content">{line.content}</span>
        </div>
      );
    case "error":
      return (
        <div className="chat-line error">
          <span className="timestamp">[{timeStr}]</span>
          <span className="prefix">!</span>
          <span className="content">{line.content}</span>
        </div>
      );
    case "info":
      return (
        <div className="chat-line info">
          <span className="timestamp">[{timeStr}]</span>
          <span className="prefix">*</span>
          <span className="content">{line.content}</span>
        </div>
      );
    case "action":
      return (
        <div className="chat-line action">
          <span className="timestamp">[{timeStr}]</span>
          <span className="prefix">→</span>
          <span className="content">{line.content}</span>
        </div>
      );
    case "message":
      return (
        <div className="chat-line message">
          <span className="timestamp">[{timeStr}]</span>
          {line.channel && <span className="channel">#{line.channel}</span>}
          <span className="sender">&lt;{line.sender}&gt;</span>
          <span className="content">{line.content}</span>
        </div>
      );
    default:
      return null;
  }
}

export default function ChatClient() {
  const {
    lines,
    currentChannel,
    joinedChannels,
    members,
    moderators,
    isConnected,
    address,
    isLoading,
    processCommand,
  } = useChat();

  const { open } = useAppKit();
  const { currentBlock } = useEvents();
  const { data: walletClient } = useWalletClient();

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

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [lines]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

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
    <div className="chat-container">
      {/* Header */}
      <header className="chat-header">
        <div className="header-left">
          <h1 className="logo">OnChat</h1>
          {currentChannel && (
            <span className="current-channel">#{currentChannel.slug}</span>
          )}
        </div>
        <div className="header-right">
          {/* Claimable balance */}
          {isConnected && address && ownerBalance > BigInt(0) && (
            <div className="balance-claim">
              <span className="balance-label">Creator Rewards:</span>
              <span className="balance-amount">
                {formatNumber(ownerBalance, { fromDecimals: 18 })} ETH
              </span>
              <button
                className="claim-btn"
                onClick={handleClaim}
                disabled={claimingBalance}
              >
                {claimingBalance ? "..." : "Claim"}
              </button>
            </div>
          )}

          {/* Wallet connection */}
          {isConnected && address ? (
            <button className="wallet-button connected" onClick={() => open()}>
              <span className="status-dot" />
              {formatAddress(address)}
            </button>
          ) : (
            <button className="wallet-button" onClick={() => open()}>
              Connect Wallet
            </button>
          )}
        </div>
      </header>

      {/* Main content */}
      <div className="chat-main">
        {/* Sidebar */}
        <aside className="chat-sidebar">
          {/* Action buttons */}
          <div className="sidebar-actions">
            <button
              className="sidebar-btn"
              onClick={() => setShowChannelBrowser(true)}
              title="Browse channels"
            >
              + Join
            </button>
            <button
              className="sidebar-btn"
              onClick={() => setShowCreateChannel(true)}
              title="Create channel"
              disabled={!isConnected}
            >
              + New
            </button>
          </div>

          {/* Channels */}
          <div className="sidebar-section">
            <h3>My Channels</h3>
            <ul className="channel-list">
              {joinedChannels.length > 0 ? (
                joinedChannels.map((slug) => (
                  <li
                    key={slug}
                    className={currentChannel?.slug === slug ? "active" : ""}
                    onClick={() => processCommand(`/join #${slug}`)}
                  >
                    <span className="channel-hash">#</span>
                    {slug}
                  </li>
                ))
              ) : (
                <li className="empty">No channels joined</li>
              )}
            </ul>
          </div>

          {/* Users */}
          {currentChannel && (
            <div className="sidebar-section">
              <h3>Users ({members.length})</h3>
              <ul className="user-list">
                {members.map((member) => {
                  const isOwner =
                    formatAddress(currentChannel.owner) === member;
                  const isModerator = moderators.includes(member);
                  return (
                    <li key={member}>
                      {isOwner && <span className="role-badge">👸🏻</span>}
                      {!isOwner && isModerator && (
                        <span className="role-badge">👩🏻‍⚖️</span>
                      )}
                      {member}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </aside>

        {/* Messages */}
        <div className="chat-messages-container">
          <div className="chat-messages">
            {lines.map((line) => (
              <ChatLineComponent key={line.id} line={line} />
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form className="chat-input-form" onSubmit={handleSubmit}>
            <div className="input-prefix">
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
              className="chat-input"
              autoComplete="off"
              spellCheck="false"
            />
            {isLoading && <div className="loading-indicator">...</div>}
          </form>
        </div>
      </div>

      {/* Status bar */}
      <footer className="chat-status">
        <span className="status-item">
          {isConnected ? (
            <>
              <span className="status-dot connected" />
              Base Network
              {currentBlock > BigInt(0) && (
                <span className="block-number">
                  ({currentBlock.toLocaleString()})
                </span>
              )}
            </>
          ) : (
            <>
              <span className="status-dot disconnected" />
              Disconnected
            </>
          )}
        </span>
        {currentChannel && (
          <>
            <span className="status-separator">|</span>
            <span className="status-item">
              {currentChannel.memberCount.toString()} users
            </span>
            <span className="status-separator">|</span>
            <span className="status-item">
              {currentChannel.messageCount.toString()} messages
            </span>
          </>
        )}
        <span className="status-right">Fully on-chain • Permissionless</span>
      </footer>

      {/* Channel Browser Modal */}
      {showChannelBrowser && (
        <div
          className="modal-overlay"
          onClick={() => setShowChannelBrowser(false)}
        >
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Browse Channels</h2>
              <button
                className="modal-close"
                onClick={() => setShowChannelBrowser(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-content">
              {loadingChannels ? (
                <div className="modal-loading">Loading channels...</div>
              ) : allChannels.length === 0 ? (
                <div className="modal-empty">
                  No channels yet. Be the first to create one!
                </div>
              ) : (
                <ul className="channel-browser-list">
                  {allChannels.map((ch) => (
                    <li key={ch.slugHash} className="channel-browser-item">
                      <div className="channel-browser-info">
                        <span className="channel-browser-name">#{ch.slug}</span>
                        <span className="channel-browser-stats">
                          {ch.memberCount.toString()} users •{" "}
                          {ch.messageCount.toString()} msgs
                        </span>
                      </div>
                      <button
                        className="channel-browser-join"
                        onClick={() => handleJoinChannel(ch.slug)}
                        disabled={!isConnected || isLoading}
                      >
                        {joinedChannels.includes(ch.slug) ? "Enter" : "Join"}
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
          className="modal-overlay"
          onClick={() => setShowCreateChannel(false)}
        >
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Create Channel</h2>
              <button
                className="modal-close"
                onClick={() => setShowCreateChannel(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-content">
              {!isConnected ? (
                <div className="modal-empty">
                  Connect your wallet to create a channel
                </div>
              ) : (
                <form
                  onSubmit={handleCreateChannel}
                  className="create-channel-form"
                >
                  <label htmlFor="channel-name">Channel Name</label>
                  <div className="create-channel-input-wrapper">
                    <span className="create-channel-hash">#</span>
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
                      className="create-channel-input"
                    />
                  </div>
                  <p className="create-channel-hint">
                    Lowercase letters and hyphens only, max 20 chars
                  </p>
                  <button
                    type="submit"
                    className="create-channel-submit"
                    disabled={!newChannelName.trim() || isLoading}
                  >
                    {isLoading ? "Creating..." : "Create Channel"}
                  </button>
                  <p className="create-channel-fee">
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
