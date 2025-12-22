"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useAppKitAccount } from "@reown/appkit/react";
import { useWalletClient } from "wagmi";
import { formatAddress, formatNumber } from "@/helpers/format";
import {
  type ChannelInfo,
  computeSlugHash,
  getLatestChannels,
  getChannelBySlug,
  getLatestMessages,
  getChannelMembers,
  getChannelModerators,
  getBannedUsers,
  getUserChannels,
  isMember,
  createChannel,
  joinChannel,
  leaveChannel,
  sendMessage,
  waitForTransaction,
  getSlugFromHash,
  getOwnerBalance,
  claimOwnerBalance,
  addModerator,
  removeModerator,
  banUser,
  unbanUser,
} from "@/helpers/contracts";
import {
  useEvents,
  type MessageSentEvent,
  type ChannelEvent,
} from "@/context/EventContext";

export interface ChatLine {
  id: string;
  type: "system" | "error" | "info" | "message" | "action";
  timestamp: Date;
  content: string;
  sender?: string;
  channel?: string;
}

interface UseChatReturn {
  // State
  lines: ChatLine[];
  currentChannel: ChannelInfo | null;
  joinedChannels: string[];
  members: string[];
  moderators: string[];
  isConnected: boolean;
  address: string | undefined;
  isLoading: boolean;

  // Actions
  processCommand: (input: string) => Promise<void>;
  refreshMessages: () => Promise<void>;
  clearLines: () => void;
}

export function useChat(): UseChatReturn {
  const { address, isConnected } = useAppKitAccount();
  const { data: walletClient } = useWalletClient();
  const { onMessageSent, onChannelEvent } = useEvents();

  const [lines, setLines] = useState<ChatLine[]>([]);
  const [currentChannel, setCurrentChannel] = useState<ChannelInfo | null>(
    null
  );
  const [joinedChannels, setJoinedChannels] = useState<string[]>([]);
  const [members, setMembers] = useState<string[]>([]);
  const [moderators, setModerators] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const lineIdCounter = useRef(0);
  // Track processed tx hashes to avoid duplicates from optimistic updates
  const processedTxHashes = useRef<Set<string>>(new Set());

  // Helper to add a line
  const addLine = useCallback(
    (
      type: ChatLine["type"],
      content: string,
      sender?: string,
      channel?: string
    ) => {
      const line: ChatLine = {
        id: `line-${lineIdCounter.current++}`,
        type,
        timestamp: new Date(),
        content,
        sender,
        channel,
      };
      setLines((prev) => [...prev, line]);
    },
    []
  );

  // Load user's joined channels
  const loadJoinedChannels = useCallback(async () => {
    if (!address) return;

    try {
      const hashes = await getUserChannels(address as `0x${string}`, 0, 100);
      const slugs: string[] = [];
      for (const hash of hashes) {
        const slug = await getSlugFromHash(hash);
        if (slug) slugs.push(slug);
      }
      setJoinedChannels(slugs);
    } catch (err) {
      console.error("Failed to load joined channels:", err);
    }
  }, [address]);

  // Load channel members and moderators
  const loadMembers = useCallback(async (slugHash: `0x${string}`) => {
    try {
      const [memberAddresses, moderatorAddresses] = await Promise.all([
        getChannelMembers(slugHash, 0, 100),
        getChannelModerators(slugHash, 0, 100),
      ]);
      setMembers(memberAddresses.map(formatAddress));
      setModerators(moderatorAddresses.map(formatAddress));
    } catch (err) {
      console.error("Failed to load members:", err);
    }
  }, []);

  // Refresh messages for current channel
  const refreshMessages = useCallback(async () => {
    if (!currentChannel) return;

    try {
      const messages = await getLatestMessages(currentChannel.slugHash, 0, 50);
      // Messages come newest first, reverse for display
      const orderedMessages = [...messages].reverse();

      // Clear old messages and add new ones
      setLines((prev) => prev.filter((l) => l.type !== "message"));

      for (const msg of orderedMessages) {
        if (!msg.isHidden) {
          addLine(
            "message",
            msg.content,
            formatAddress(msg.sender),
            currentChannel.slug
          );
        }
      }
    } catch (err) {
      console.error("Failed to refresh messages:", err);
    }
  }, [currentChannel, addLine]);

  // Welcome message on mount (only once)
  useEffect(() => {
    addLine(
      "system",
      "╔════════════════════════════════════════════════════════════╗"
    );
    addLine(
      "system",
      "║                    Welcome to OnChat                       ║"
    );
    addLine(
      "system",
      "║          Fully permissionless, on-chain chat               ║"
    );
    addLine(
      "system",
      "╚════════════════════════════════════════════════════════════╝"
    );
    addLine("info", "Type /help for available commands");
    addLine("info", "Connect your wallet to start chatting");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load joined channels when wallet connects
  const prevConnectedRef = useRef(false);
  useEffect(() => {
    if (isConnected && address && !prevConnectedRef.current) {
      prevConnectedRef.current = true;
      // Defer state updates to avoid synchronous setState in effect
      const timeoutId = setTimeout(() => {
        loadJoinedChannels();
        addLine("system", `Connected as ${formatAddress(address)}`);
      }, 0);
      return () => clearTimeout(timeoutId);
    } else if (!isConnected) {
      prevConnectedRef.current = false;
    }
  }, [isConnected, address, loadJoinedChannels, addLine]);

  // Subscribe to real-time message events
  const currentChannelRef = useRef(currentChannel);
  useEffect(() => {
    currentChannelRef.current = currentChannel;
  }, [currentChannel]);

  useEffect(() => {
    const unsubMessage = onMessageSent((event: MessageSentEvent) => {
      const channel = currentChannelRef.current;
      if (!channel) return;

      // Only process messages for the current channel
      if (event.slugHash !== channel.slugHash) return;

      // Skip if we already processed this tx (from optimistic update)
      if (processedTxHashes.current.has(event.transactionHash)) {
        processedTxHashes.current.delete(event.transactionHash);
        return;
      }

      // Add the new message
      const line: ChatLine = {
        id: `line-${lineIdCounter.current++}`,
        type: "message",
        timestamp: new Date(),
        content: event.content,
        sender: formatAddress(event.sender),
        channel: channel.slug,
      };
      setLines((prev) => [...prev, line]);
    });

    const unsubChannel = onChannelEvent((event: ChannelEvent) => {
      const channel = currentChannelRef.current;

      // Update member list if someone joins/leaves current channel
      if (channel && event.slugHash === channel.slugHash) {
        if (event.type === "joined" && event.user) {
          setMembers((prev) => {
            const addr = formatAddress(event.user!);
            if (prev.includes(addr)) return prev;
            return [...prev, addr];
          });
        } else if (event.type === "left" && event.user) {
          setMembers((prev) =>
            prev.filter((m) => m !== formatAddress(event.user!))
          );
        }
      }

      // Reload joined channels if a new channel is created or user joins/leaves
      if (address) {
        loadJoinedChannels();
      }
    });

    return () => {
      unsubMessage();
      unsubChannel();
    };
  }, [onMessageSent, onChannelEvent, address, loadJoinedChannels]);

  // Process user input
  const processCommand = useCallback(
    async (input: string) => {
      const trimmed = input.trim();
      if (!trimmed) return;

      // Check if it's a command
      if (trimmed.startsWith("/")) {
        const parts = trimmed.slice(1).split(" ");
        const command = parts[0].toLowerCase();
        const args = parts.slice(1);

        switch (command) {
          case "help":
            addLine("info", "═══ Available Commands ═══");
            addLine("info", "/list              - List all channels");
            addLine("info", "/join #channel     - Join a channel");
            addLine("info", "/part              - Leave current channel");
            addLine("info", "/create #channel   - Create a new channel");
            addLine("info", "/who               - List users in channel");
            addLine(
              "info",
              "/mode              - Show channel moderators & bans"
            );
            addLine("info", "/mode +o 0x...     - Add moderator (owner only)");
            addLine(
              "info",
              "/mode -o 0x...     - Remove moderator (owner only)"
            );
            addLine("info", "/mode +b 0x...     - Ban user");
            addLine("info", "/mode -b 0x...     - Unban user");
            addLine("info", "/msg message       - Send message (or just type)");
            addLine("info", "/balance           - Check claimable rewards");
            addLine("info", "/claim             - Claim creator rewards");
            addLine("info", "/clear             - Clear screen");
            break;

          case "list":
            setIsLoading(true);
            try {
              const channels = await getLatestChannels(0, 20);
              if (channels.length === 0) {
                addLine(
                  "info",
                  "No channels found. Create one with /create #channel-name"
                );
              } else {
                addLine("info", `═══ Channels (${channels.length}) ═══`);
                for (const ch of channels) {
                  addLine(
                    "info",
                    `#${ch.slug} - ${ch.memberCount} users, ${ch.messageCount} messages`
                  );
                }
              }
            } catch (err) {
              addLine("error", `Failed to list channels: ${err}`);
            }
            setIsLoading(false);
            break;

          case "join":
            if (!isConnected || !walletClient) {
              addLine("error", "Please connect your wallet first");
              break;
            }

            if (args.length === 0) {
              addLine("error", "Usage: /join #channel-name");
              break;
            }

            const channelToJoin = args[0].replace("#", "");
            setIsLoading(true);

            try {
              const slugHash = computeSlugHash(channelToJoin);
              const channelInfo = await getChannelBySlug(channelToJoin);

              // Check if already a member
              const alreadyMember = await isMember(
                slugHash,
                address as `0x${string}`
              );

              if (!alreadyMember) {
                addLine("action", `Joining #${channelToJoin}...`);
                const tx = await joinChannel(walletClient, slugHash);
                addLine(
                  "info",
                  "Transaction sent, waiting for confirmation..."
                );
                await waitForTransaction(tx);
                await loadJoinedChannels();
              }

              setCurrentChannel(channelInfo);
              await loadMembers(slugHash);
              addLine("system", `* Now talking in #${channelToJoin}`);
              addLine(
                "info",
                `Topic: On-chain chat on Base | ${channelInfo.memberCount} users`
              );

              // Load recent messages
              const messages = await getLatestMessages(slugHash, 0, 20);
              const orderedMessages = [...messages].reverse();
              for (const msg of orderedMessages) {
                if (!msg.isHidden) {
                  addLine(
                    "message",
                    msg.content,
                    formatAddress(msg.sender),
                    channelToJoin
                  );
                }
              }
            } catch (err: unknown) {
              const errorMessage =
                err instanceof Error ? err.message : String(err);
              if (errorMessage.includes("ChannelNotFound")) {
                addLine(
                  "error",
                  `Channel #${channelToJoin} does not exist. Create it with /create #${channelToJoin}`
                );
              } else {
                addLine("error", `Failed to join channel: ${errorMessage}`);
              }
            }
            setIsLoading(false);
            break;

          case "part":
          case "leave":
            if (!currentChannel) {
              addLine("error", "You are not in a channel");
              break;
            }

            if (!walletClient) {
              addLine("error", "Wallet not connected");
              break;
            }

            setIsLoading(true);
            try {
              addLine("action", `Leaving #${currentChannel.slug}...`);
              const tx = await leaveChannel(
                walletClient,
                currentChannel.slugHash
              );
              await waitForTransaction(tx);
              addLine("system", `* You have left #${currentChannel.slug}`);
              setCurrentChannel(null);
              setMembers([]);
              await loadJoinedChannels();
            } catch (err) {
              addLine("error", `Failed to leave channel: ${err}`);
            }
            setIsLoading(false);
            break;

          case "create":
            if (!isConnected || !walletClient) {
              addLine("error", "Please connect your wallet first");
              break;
            }

            if (args.length === 0) {
              addLine("error", "Usage: /create #channel-name");
              break;
            }

            const newChannel = args[0].replace("#", "").toLowerCase();

            // Validate slug
            if (!/^[a-z-]{1,20}$/.test(newChannel)) {
              addLine(
                "error",
                "Channel name must be 1-20 characters, lowercase letters and hyphens only"
              );
              break;
            }

            setIsLoading(true);
            try {
              addLine("action", `Creating #${newChannel}...`);
              const tx = await createChannel(walletClient, newChannel);
              addLine("info", "Transaction sent, waiting for confirmation...");
              await waitForTransaction(tx);
              addLine("system", `* Channel #${newChannel} created!`);

              // Auto-join the channel
              const channelInfo = await getChannelBySlug(newChannel);
              setCurrentChannel(channelInfo);
              await loadMembers(channelInfo.slugHash);
              await loadJoinedChannels();
              addLine("system", `* Now talking in #${newChannel}`);
            } catch (err: unknown) {
              const errorMessage =
                err instanceof Error ? err.message : String(err);
              if (errorMessage.includes("ChannelAlreadyExists")) {
                addLine(
                  "error",
                  `Channel #${newChannel} already exists. Use /join to join it.`
                );
              } else {
                addLine("error", `Failed to create channel: ${errorMessage}`);
              }
            }
            setIsLoading(false);
            break;

          case "who":
          case "names":
            if (!currentChannel) {
              addLine("error", "You are not in a channel");
              break;
            }

            addLine("info", `═══ Users in #${currentChannel.slug} ═══`);
            addLine("info", members.join(" "));
            break;

          case "msg":
          case "say":
            if (!currentChannel) {
              addLine("error", "Join a channel first with /join #channel");
              break;
            }

            const msgContent = args.join(" ");
            if (!msgContent) {
              addLine("error", "Usage: /msg <message>");
              break;
            }

            await sendMessageToChannel(msgContent);
            break;

          case "clear":
            setLines([]);
            addLine("system", "Screen cleared");
            break;

          case "balance":
            if (!isConnected || !address) {
              addLine("error", "Connect your wallet first");
              break;
            }
            setIsLoading(true);
            try {
              const ownerBal = await getOwnerBalance(address as `0x${string}`);
              addLine("info", "═══ Your Balance ═══");
              addLine(
                "info",
                `Creator Rewards: ${formatNumber(ownerBal, {
                  fromDecimals: 18,
                })} ETH`
              );
              if (ownerBal > BigInt(0)) {
                addLine("info", "Use /claim to claim your rewards");
              }
            } catch (err) {
              addLine("error", `Failed to get balance: ${err}`);
            }
            setIsLoading(false);
            break;

          case "claim":
            if (!isConnected || !walletClient) {
              addLine("error", "Connect your wallet first");
              break;
            }
            setIsLoading(true);
            try {
              const ownerBal = await getOwnerBalance(address as `0x${string}`);
              if (ownerBal > BigInt(0)) {
                addLine(
                  "info",
                  `Claiming ${formatNumber(ownerBal, {
                    fromDecimals: 18,
                  })} ETH...`
                );
                const tx = await claimOwnerBalance(walletClient);
                await waitForTransaction(tx);
                addLine(
                  "system",
                  `✓ Claimed ${formatNumber(ownerBal, {
                    fromDecimals: 18,
                  })} ETH creator rewards`
                );
              } else {
                addLine("info", "No creator rewards to claim");
              }
            } catch (err: unknown) {
              const errorMessage =
                err instanceof Error ? err.message : String(err);
              addLine("error", `Failed to claim: ${errorMessage}`);
            }
            setIsLoading(false);
            break;

          case "mode": {
            // Parse mode command: /mode [#channel] [+o|-o|+b|-b] [wallet]
            // Examples:
            //   /mode                  - Show moderators and banned users for current channel
            //   /mode #channel         - Show moderators and banned users for specified channel
            //   /mode +o 0x123...      - Add moderator to current channel
            //   /mode #channel +o 0x123... - Add moderator to specified channel

            let targetSlug: string | null = null;
            let modeFlag: string | null = null;
            let targetWallet: string | null = null;

            // Parse arguments
            let argIndex = 0;
            if (args[argIndex]?.startsWith("#")) {
              targetSlug = args[argIndex].replace("#", "");
              argIndex++;
            }

            if (args[argIndex]?.match(/^[+-][ob]$/i)) {
              modeFlag = args[argIndex].toLowerCase();
              argIndex++;
            }

            if (args[argIndex]?.match(/^0x[a-fA-F0-9]{40}$/)) {
              targetWallet = args[argIndex];
            }

            // Determine which channel to operate on
            const channelSlug = targetSlug || currentChannel?.slug;
            if (!channelSlug) {
              addLine(
                "error",
                "No channel specified. Join a channel or use /mode #channel"
              );
              break;
            }

            setIsLoading(true);
            try {
              const slugHash = computeSlugHash(channelSlug);
              const channelInfo = await getChannelBySlug(channelSlug);

              // If no mode flag, just display info
              if (!modeFlag) {
                const [mods, banned] = await Promise.all([
                  getChannelModerators(slugHash, 0, 100),
                  getBannedUsers(slugHash, 0, 100),
                ]);

                addLine("info", `═══ Mode for #${channelSlug} ═══`);
                addLine(
                  "info",
                  `Owner: ${formatAddress(channelInfo.owner)}${
                    channelInfo.owner.toLowerCase() === address?.toLowerCase()
                      ? " (you)"
                      : ""
                  }`
                );

                if (mods.length > 0) {
                  addLine("info", `Moderators (+o): ${mods.length}`);
                  for (const mod of mods) {
                    const isYou =
                      mod.toLowerCase() === address?.toLowerCase()
                        ? " (you)"
                        : "";
                    addLine("info", `  +o ${formatAddress(mod)}${isYou}`);
                  }
                } else {
                  addLine("info", "Moderators (+o): none");
                }

                if (banned.length > 0) {
                  addLine("info", `Banned (+b): ${banned.length}`);
                  for (const user of banned) {
                    addLine("info", `  +b ${formatAddress(user)}`);
                  }
                } else {
                  addLine("info", "Banned (+b): none");
                }
                setIsLoading(false);
                break;
              }

              // Mode operations require wallet connection
              if (!isConnected || !walletClient) {
                addLine("error", "Connect your wallet first");
                setIsLoading(false);
                break;
              }

              // Mode operations require a target wallet
              if (!targetWallet) {
                addLine("error", `Usage: /mode ${modeFlag} 0xWalletAddress`);
                setIsLoading(false);
                break;
              }

              const targetAddr = targetWallet as `0x${string}`;

              switch (modeFlag) {
                case "+o": {
                  // Add moderator (owner only)
                  addLine(
                    "action",
                    `Adding moderator ${formatAddress(
                      targetAddr
                    )} to #${channelSlug}...`
                  );
                  const tx = await addModerator(
                    walletClient,
                    slugHash,
                    targetAddr
                  );
                  addLine(
                    "info",
                    "Transaction sent, waiting for confirmation..."
                  );
                  await waitForTransaction(tx);
                  addLine(
                    "system",
                    `✓ ${formatAddress(
                      targetAddr
                    )} is now a moderator of #${channelSlug}`
                  );
                  await loadMembers(slugHash);
                  break;
                }
                case "-o": {
                  // Remove moderator (owner only)
                  addLine(
                    "action",
                    `Removing moderator ${formatAddress(
                      targetAddr
                    )} from #${channelSlug}...`
                  );
                  const tx = await removeModerator(
                    walletClient,
                    slugHash,
                    targetAddr
                  );
                  addLine(
                    "info",
                    "Transaction sent, waiting for confirmation..."
                  );
                  await waitForTransaction(tx);
                  addLine(
                    "system",
                    `✓ ${formatAddress(
                      targetAddr
                    )} is no longer a moderator of #${channelSlug}`
                  );
                  await loadMembers(slugHash);
                  break;
                }
                case "+b": {
                  // Ban user (owner/moderator)
                  addLine(
                    "action",
                    `Banning ${formatAddress(
                      targetAddr
                    )} from #${channelSlug}...`
                  );
                  const tx = await banUser(walletClient, slugHash, targetAddr);
                  addLine(
                    "info",
                    "Transaction sent, waiting for confirmation..."
                  );
                  await waitForTransaction(tx);
                  addLine(
                    "system",
                    `✓ ${formatAddress(
                      targetAddr
                    )} has been banned from #${channelSlug}`
                  );
                  await loadMembers(slugHash);
                  break;
                }
                case "-b": {
                  // Unban user (owner/moderator)
                  addLine(
                    "action",
                    `Unbanning ${formatAddress(
                      targetAddr
                    )} from #${channelSlug}...`
                  );
                  const tx = await unbanUser(
                    walletClient,
                    slugHash,
                    targetAddr
                  );
                  addLine(
                    "info",
                    "Transaction sent, waiting for confirmation..."
                  );
                  await waitForTransaction(tx);
                  addLine(
                    "system",
                    `✓ ${formatAddress(
                      targetAddr
                    )} has been unbanned from #${channelSlug}`
                  );
                  break;
                }
                default:
                  addLine("error", `Unknown mode flag: ${modeFlag}`);
              }
            } catch (err: unknown) {
              const errorMessage =
                err instanceof Error ? err.message : String(err);
              if (errorMessage.includes("NotChannelOwner")) {
                addLine(
                  "error",
                  "Only the channel owner can add/remove moderators"
                );
              } else if (errorMessage.includes("NotChannelOwnerOrModerator")) {
                addLine(
                  "error",
                  "Only the channel owner or moderators can ban/unban users"
                );
              } else if (errorMessage.includes("AlreadyModerator")) {
                addLine("error", "User is already a moderator");
              } else if (errorMessage.includes("NotModerator")) {
                addLine("error", "User is not a moderator");
              } else if (errorMessage.includes("UserBanned")) {
                addLine("error", "User is already banned");
              } else if (errorMessage.includes("UserNotBanned")) {
                addLine("error", "User is not banned");
              } else if (errorMessage.includes("NotMember")) {
                addLine(
                  "error",
                  "User must be a member of the channel to become a moderator"
                );
              } else if (errorMessage.includes("CannotBanOwner")) {
                addLine("error", "Cannot ban the channel owner");
              } else if (errorMessage.includes("ChannelNotFound")) {
                addLine("error", `Channel not found`);
              } else {
                addLine("error", `Failed: ${errorMessage}`);
              }
            }
            setIsLoading(false);
            break;
          }

          default:
            addLine(
              "error",
              `Unknown command: /${command}. Type /help for available commands.`
            );
        }
      } else {
        // Regular message
        await sendMessageToChannel(trimmed);
      }

      async function sendMessageToChannel(content: string) {
        if (!currentChannel) {
          addLine("error", "Join a channel first with /join #channel");
          return;
        }

        if (!walletClient) {
          addLine("error", "Wallet not connected");
          return;
        }

        setIsLoading(true);
        try {
          // Show the message immediately (optimistic update)
          addLine(
            "message",
            content,
            formatAddress(address!),
            currentChannel.slug
          );

          const tx = await sendMessage(
            walletClient,
            currentChannel.slugHash,
            content
          );
          // Track tx hash to avoid duplicate from event subscription
          processedTxHashes.current.add(tx);
          await waitForTransaction(tx);
          // Message already shown optimistically
        } catch (err: unknown) {
          const errorMessage = err instanceof Error ? err.message : String(err);
          addLine("error", `Failed to send message: ${errorMessage}`);
        }
        setIsLoading(false);
      }
    },
    [
      isConnected,
      walletClient,
      address,
      currentChannel,
      members,
      addLine,
      loadJoinedChannels,
      loadMembers,
    ]
  );

  const clearLines = useCallback(() => {
    setLines([]);
  }, []);

  return {
    lines,
    currentChannel,
    joinedChannels,
    members,
    moderators,
    isConnected,
    address,
    isLoading,
    processCommand,
    refreshMessages,
    clearLines,
  };
}
