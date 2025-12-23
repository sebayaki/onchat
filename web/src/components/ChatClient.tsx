"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useChat, type ChatLine } from "@/hooks/useChat";
import { useFarcasterProfiles } from "@/hooks/useFarcasterProfiles";
import { useAppKit } from "@reown/appkit/react";
import { useEvents } from "@/context/EventContext";
import { useTheme } from "@/context/ThemeContext";
import {
  getLatestChannels,
  getOwnerBalance,
  claimOwnerBalance,
  waitForTransaction,
  type ChannelInfo,
} from "@/helpers/contracts";
import { useWalletClient } from "wagmi";

// Sub-components
import { Header } from "./Header";
import { Sidebar } from "./chat/Sidebar";
import { RewardsView } from "./RewardsView";
import { MessageList } from "./chat/MessageList";
import { ChatInput } from "./chat/ChatInput";
import { MobileNav } from "./MobileNav";
import { FooterBar } from "./FooterBar";
import { ChannelBrowserModal } from "./chat/ChannelBrowserModal";
import { CreateChannelModal } from "./chat/CreateChannelModal";
import { ShareModal } from "./ShareModal";

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
  const { hideMobileTabs, hideBrand } = useTheme();

  // Mobile state
  const [activeTab, setActiveTab] = useState<"chat" | "channels" | "rewards">(
    "chat"
  );

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
  const [showShareModal, setShowShareModal] = useState(false);
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
    const params = new URLSearchParams(window.location.search).toString();
    const search = params ? `?${params}` : "";

    if (currentChannel?.slug) {
      const newPath = `/${currentChannel.slug}${search}`;
      if (window.location.pathname + window.location.search !== newPath) {
        window.history.pushState({}, "", newPath);
      }
    } else if (
      currentChannel === null &&
      window.location.pathname + window.location.search !== `/${search}`
    ) {
      window.history.pushState({}, "", `/${search}`);
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
      <Header
        currentChannel={currentChannel}
        isConnected={isConnected}
        address={address}
        ownerBalance={ownerBalance}
        onRewardsClick={() => setActiveTab("rewards")}
        openWalletModal={() => open()}
        profiles={profiles}
        onShareClick={() => setShowShareModal(true)}
        hideBrand={hideBrand}
      />

      <div className="flex flex-1 min-h-0 overflow-hidden relative">
        <Sidebar
          activeTab={activeTab}
          joinedChannels={joinedChannels}
          currentChannel={currentChannel}
          members={members}
          moderators={moderators}
          profiles={profiles}
          isConnected={isConnected}
          processCommand={processCommand}
          setActiveTab={setActiveTab}
          setShowChannelBrowser={setShowChannelBrowser}
          setShowCreateChannel={setShowCreateChannel}
        />

        <div
          className={`${
            activeTab === "channels" ? "hidden sm:flex" : "flex"
          } flex-1 flex flex-col min-w-0 overflow-hidden`}
        >
          {activeTab === "rewards" ? (
            <RewardsView
              ownerBalance={ownerBalance}
              claimingBalance={claimingBalance}
              handleClaim={handleClaim}
            />
          ) : (
            <>
              <MessageList
                lines={lines}
                profiles={profiles}
                messagesEndRef={messagesEndRef}
              />
              <ChatInput
                input={input}
                setInput={setInput}
                handleKeyDown={handleKeyDown}
                handleSubmit={handleSubmit}
                isLoading={isLoading}
                isConnected={isConnected}
                currentChannel={currentChannel}
                showJoinButton={showJoinButton}
                handleJoinChannel={handleJoinChannel}
                channelSlug={channelSlug}
                inputRef={inputRef}
              />
            </>
          )}
        </div>
      </div>

      {!hideMobileTabs && (
        <MobileNav
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          messageCount={currentChannel?.messageCount}
        />
      )}

      <FooterBar
        isConnected={isConnected}
        currentBlock={currentBlock}
        currentChannel={currentChannel}
      />

      <ChannelBrowserModal
        showChannelBrowser={showChannelBrowser}
        setShowChannelBrowser={setShowChannelBrowser}
        loadingChannels={loadingChannels}
        allChannels={allChannels}
        handleJoinChannel={handleJoinChannel}
        joinedChannels={joinedChannels}
        isConnected={isConnected}
        isLoading={isLoading}
      />

      <CreateChannelModal
        showCreateChannel={showCreateChannel}
        setShowCreateChannel={setShowCreateChannel}
        isConnected={isConnected}
        handleCreateChannel={handleCreateChannel}
        newChannelName={newChannelName}
        setNewChannelName={setNewChannelName}
        isLoading={isLoading}
      />

      <ShareModal
        showShareModal={showShareModal}
        setShowShareModal={setShowShareModal}
        currentChannel={currentChannel}
      />
    </div>
  );
}
