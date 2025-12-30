import { useState, useCallback, useRef, useEffect, ReactNode } from "react";
import { useAppKitAccount } from "@reown/appkit/react";
import { useWalletClient } from "wagmi";
import { formatAddress, formatNumber } from "@/helpers/format";
import {
  type ChannelInfo,
  computeSlugHash,
  getAllChannels,
  getChannelBySlug,
  getLatestMessages,
  getChannel,
  getChannelMembers,
  getChannelModerators,
  getBannedUsers,
  getUserChannels,
  getUserChannelCount,
  isMember,
  isModerator,
  createChannel,
  joinChannel,
  leaveChannel,
  sendMessage,
  hideMessage,
  unhideMessage,
  waitForTransaction,
  getOwnerBalance,
  claimOwnerBalance,
  addModerator,
  removeModerator,
  banUser,
  unbanUser,
} from "@/helpers/contracts";
import {
  handleTransactionError,
  isUserRejectedError,
} from "@/helpers/transactions";
import {
  useEvents,
  type MessageSentEvent,
  type ChannelEvent,
  type ModerationEvent,
} from "@/context/EventContext";
import { fetchUserProfilesBulk } from "@/helpers/farcaster";
import { renderWhoisChannels } from "@/components/WhoisChannels";
import { STORAGE_KEYS } from "@/configs/constants";

export interface ChannelListItem {
  slug: string;
  memberCount: bigint;
  messageCount: bigint;
}

export interface ChatLine {
  id: string;
  type:
    | "system"
    | "error"
    | "info"
    | "message"
    | "action"
    | "command"
    | "user"
    | "channelList"
    | "userList";
  timestamp: Date;
  content: string | ReactNode;
  sender?: string;
  senderAddress?: string;
  channel?: string;
  messageIndex?: number;
  isHidden?: boolean;
  isPending?: boolean;
  transactionHash?: string;
  channels?: ChannelListItem[];
  users?: string[]; // For userList type - array of addresses
}

interface UseChatReturn {
  // State
  lines: ChatLine[];
  currentChannel: ChannelInfo | null;
  joinedChannels: ChannelInfo[];
  members: string[];
  moderators: string[];
  isModerator: boolean;
  isConnected: boolean;
  isWalletLoading: boolean;
  address: string | undefined;
  isLoading: boolean;
  isInitialChannelLoading: boolean;
  isLoadingChannels: boolean;
  scrollSignal: number; // Incremented when chat should scroll to bottom

  // Actions
  processCommand: (input: string) => Promise<void>;
  clearLines: () => void;
  enterChannel: (slug: string | null | undefined) => Promise<void>;
}

export function useChat(initialChannelSlug?: string): UseChatReturn {
  const { address, isConnected, status: accountStatus } = useAppKitAccount();
  const isWalletLoading =
    accountStatus === "connecting" || accountStatus === "reconnecting";
  const { data: walletClient } = useWalletClient();
  const { onMessageSent, onChannelEvent, onModerationEvent } = useEvents();

  const [lines, setLines] = useState<ChatLine[]>([]);
  const [currentChannel, setCurrentChannel] = useState<ChannelInfo | null>(
    null
  );
  const [joinedChannels, setJoinedChannels] = useState<ChannelInfo[]>([]);
  const [members, setMembers] = useState<string[]>([]);
  const [moderators, setModerators] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialChannelLoading, setIsInitialChannelLoading] = useState(
    !!initialChannelSlug
  );
  // Initialize as loading if we already have a connection to restore
  const [isLoadingChannels, setIsLoadingChannels] = useState(
    isConnected && !!address
  );
  // Signal to trigger scroll to bottom (incremented when needed)
  const [scrollSignal, setScrollSignal] = useState(0);

  const lineIdCounter = useRef(0);
  // Track processed tx hashes to avoid duplicates from optimistic updates
  const processedTxHashes = useRef<Set<string>>(new Set());
  const welcomeShownRef = useRef(false);

  // Helper to add a line
  const addLine = useCallback(
    (
      type: ChatLine["type"],
      content: string | ReactNode,
      sender?: string,
      senderAddress?: string,
      channel?: string,
      messageIndex?: number,
      isHidden?: boolean,
      isPending?: boolean,
      transactionHash?: string
    ) => {
      const line: ChatLine = {
        id: `line-${lineIdCounter.current++}`,
        type,
        timestamp: new Date(),
        content,
        sender,
        senderAddress,
        channel,
        messageIndex,
        isHidden,
        isPending,
        transactionHash,
      };
      setLines((prev) => [...prev, line]);
    },
    []
  );

  // Load user's joined channels
  const loadJoinedChannels = useCallback(async () => {
    if (!address) return;

    setIsLoadingChannels(true);
    try {
      const hashes = await getUserChannels(address as `0x${string}`, 0, 100);
      const channels: ChannelInfo[] = [];
      for (const hash of hashes) {
        const info = await getChannel(hash);
        if (info) channels.push(info);
      }
      setJoinedChannels(channels);
    } catch (err) {
      console.error("Failed to load joined channels:", err);
    } finally {
      setIsLoadingChannels(false);
    }
  }, [address]);

  // Load channel members and moderators
  const loadMembers = useCallback(async (slugHash: `0x${string}`) => {
    try {
      const [memberAddresses, moderatorAddresses] = await Promise.all([
        getChannelMembers(slugHash, 0, 100),
        getChannelModerators(slugHash, 0, 100),
      ]);
      setMembers(memberAddresses as string[]);
      setModerators(moderatorAddresses as string[]);
    } catch (err) {
      console.error("Failed to load members:", err);
    }
  }, []);

  // Enter a channel (fetch info and messages) without necessarily joining on-chain
  const enterChannel = useCallback(
    async (slug: string | null | undefined) => {
      if (!slug) {
        setCurrentChannel(null);
        setMembers([]);
        setModerators([]);
        // Clear messages when going to home
        setLines((prev) => prev.filter((l) => l.type !== "message"));
        setIsInitialChannelLoading(false);
        return;
      }

      const cleanSlug = slug.replace("#", "").toLowerCase();
      setIsInitialChannelLoading(true);
      try {
        const channelInfo = await getChannelBySlug(cleanSlug);
        const slugHash = computeSlugHash(cleanSlug);

        setCurrentChannel(channelInfo);
        await loadMembers(slugHash);

        // Load recent messages
        const messages = await getLatestMessages(slugHash, 0, 20);
        const orderedMessages = [...messages].reverse();

        // Clear existing messages when switching channels
        setLines((prev) => prev.filter((l) => l.type !== "message"));

        // Determine if user is moderator to show hidden messages
        const isMod =
          address &&
          (channelInfo.owner.toLowerCase() === address.toLowerCase() ||
            moderators.some((m) => m.toLowerCase() === address.toLowerCase()));

        for (let i = 0; i < orderedMessages.length; i++) {
          const msg = orderedMessages[i];
          // In latest messages (newest first), if limit=20, offset=0:
          // messages[0] is index length-1
          // messages[1] is index length-2
          // ...
          // messages[messages.length-1] is index length-messages.length
          // orderedMessages is messages reversed
          // orderedMessages[0] is messages[messages.length-1] index length-messages.length
          // orderedMessages[i] is index length-messages.length + i
          const msgIndex =
            Number(channelInfo.messageCount) - orderedMessages.length + i;

          if (!msg.isHidden || isMod) {
            addLine(
              "message",
              msg.content,
              formatAddress(msg.sender),
              msg.sender,
              cleanSlug,
              msgIndex,
              msg.isHidden
            );
          }
        }
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        if (errorMessage.includes("OnChat__ChannelNotFound")) {
          console.warn(`[OnChat] Channel "${cleanSlug}" does not exist.`);
          addLine("error", `Channel "#${cleanSlug}" does not exist.`);
        } else {
          console.error("Failed to enter channel:", err);
        }
      } finally {
        setIsInitialChannelLoading(false);
      }
    },
    [loadMembers, addLine, address, moderators]
  );

  // Welcome message on mount (only once)
  useEffect(() => {
    if (welcomeShownRef.current) return;
    welcomeShownRef.current = true;

    addLine("system", "Welcome to OnChat");
    addLine("system", "Fully permissionless, on-chain chat");
    addLine("system", "───────────────────────");
    addLine("info", "Type /help for available commands");
    if (!isConnected) {
      addLine("info", "Connect your wallet to start chatting");
    }

    // If an initial channel is provided, enter it
    if (initialChannelSlug) {
      enterChannel(initialChannelSlug);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load joined channels when wallet connects or changes
  const prevAddressRef = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (isConnected && address) {
      if (address !== prevAddressRef.current) {
        const isSwitching = prevAddressRef.current !== undefined;
        prevAddressRef.current = address;

        loadJoinedChannels();
        if (isSwitching) {
          addLine("system", `Switched to account ${formatAddress(address)}`);
        } else {
          addLine("system", `Connected as ${formatAddress(address)}`);
        }
      }
    } else if (!isConnected || !address) {
      if (prevAddressRef.current !== undefined) {
        prevAddressRef.current = undefined;
        setJoinedChannels([]);
      }
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

      // Check if we have an optimistic message for this transaction
      setLines((prev) => {
        const existingLineIndex = prev.findIndex(
          (l) =>
            l.type === "message" && l.transactionHash === event.transactionHash
        );

        if (existingLineIndex !== -1) {
          // Update the optimistic message
          const newLines = [...prev];
          newLines[existingLineIndex] = {
            ...newLines[existingLineIndex],
            isPending: false,
            messageIndex: Number(event.messageIndex),
            // Optionally update timestamp to the one from the event
            timestamp: new Date(),
          };
          return newLines;
        }

        // Add the new message
        const line: ChatLine = {
          id: `line-${lineIdCounter.current++}`,
          type: "message",
          timestamp: new Date(),
          content: event.content,
          sender: formatAddress(event.sender),
          senderAddress: event.sender,
          channel: channel.slug,
          messageIndex: Number(event.messageIndex),
          isHidden: false,
        };
        return [...prev, line];
      });

      // Remove from processedTxHashes if it was there
      processedTxHashes.current.delete(event.transactionHash);
    });

    const unsubModeration = onModerationEvent((event: ModerationEvent) => {
      const channel = currentChannelRef.current;
      if (!channel || event.slugHash !== channel.slugHash) return;

      if (event.type === "messageHidden" || event.type === "messageUnhidden") {
        const isHidden = event.type === "messageHidden";
        setLines((prev) =>
          prev.map((line) => {
            if (
              line.type === "message" &&
              line.messageIndex === Number(event.messageIndex)
            ) {
              return { ...line, isHidden };
            }
            return line;
          })
        );
      }
    });

    const unsubChannel = onChannelEvent((event: ChannelEvent) => {
      const channel = currentChannelRef.current;

      // Update member list if someone joins/leaves current channel
      if (channel && event.slugHash === channel.slugHash) {
        if (event.type === "joined" && event.user) {
          setMembers((prev) => {
            const addr = event.user!;
            if (prev.includes(addr)) return prev;
            return [...prev, addr];
          });
        } else if (event.type === "left" && event.user) {
          setMembers((prev) => prev.filter((m) => m !== event.user!));
        }
      }

      // Reload joined channels if a new channel is created or user joins/leaves
      if (address) {
        loadJoinedChannels();
      }
    });

    return () => {
      unsubMessage();
      unsubModeration();
      unsubChannel();
    };
  }, [
    onMessageSent,
    onModerationEvent,
    onChannelEvent,
    address,
    loadJoinedChannels,
  ]);

  // Persist last channel to localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;

    if (currentChannel?.slug) {
      localStorage.setItem(STORAGE_KEYS.LAST_CHANNEL, currentChannel.slug);
    } else if (currentChannel === null && !isInitialChannelLoading) {
      localStorage.removeItem(STORAGE_KEYS.LAST_CHANNEL);
    }
  }, [currentChannel, isInitialChannelLoading]);

  // Process user input
  const processCommand = useCallback(
    async (input: string) => {
      const trimmed = input.trim();
      if (!trimmed) return;

      const handleWhois = async (addr: string) => {
        setIsLoading(true);
        try {
          // Fetch Farcaster profile and OnChat channel info in parallel
          const [profiles, channelHashes, channelCount] = await Promise.all([
            fetchUserProfilesBulk([addr]),
            getUserChannels(addr as `0x${string}`, 0, 10), // Get first 10 channels
            getUserChannelCount(addr as `0x${string}`),
          ]);

          const profile = profiles[addr.toLowerCase()];

          if (!profile) {
            addLine(
              "info",
              `No Farcaster profile found for ${formatAddress(addr)}`
            );
          } else {
            addLine("info", `═══ Farcaster Profile: @${profile.username} ═══`);
            addLine("info", `Display Name: ${profile.displayName}`);
            if (profile.bio) addLine("info", `Bio: ${profile.bio}`);
            addLine("info", `FID: ${profile.fid}`);
            addLine(
              "info",
              `Followers: ${profile.followersCount} | Following: ${profile.followingCount}`
            );
            if (profile.twitter)
              addLine("info", `Twitter: @${profile.twitter}`);
            if (profile.github) addLine("info", `GitHub: ${profile.github}`);
            if (profile.proSubscribed)
              addLine("info", "Badge: Farcaster Pro Subscriber ✅");
          }

          // Add OnChat info
          addLine("info", "═══ OnChat Info ═══");
          if (channelCount === BigInt(0)) {
            addLine("info", "Joined Channels: None");
          } else {
            const channelDetails = await Promise.all(
              channelHashes.map(async (hash) => {
                const [info, isMod] = await Promise.all([
                  getChannel(hash),
                  isModerator(hash, addr as `0x${string}`),
                ]);
                return { info, isMod };
              })
            );

            addLine(
              "info",
              renderWhoisChannels({
                channelCount,
                channelDetails,
                addr,
              })
            );
          }
        } catch (err) {
          addLine("error", `Failed to fetch info: ${err}`);
        }
        setIsLoading(false);
      };

      // Check if it's a command
      if (trimmed.startsWith("/")) {
        // Echo command
        addLine("command", input, undefined, currentChannel?.slug);
        const parts = trimmed.slice(1).split(" ");
        const command = parts[0].toLowerCase();
        const args = parts.slice(1);

        switch (command) {
          case "help":
            addLine("system", "CHANNELS");
            addLine("info", "  /list              List all channels");
            addLine("info", "  /join #channel     Join a channel");
            addLine("info", "  /part              Leave current channel");
            addLine("info", "  /create #channel   Create a new channel");
            addLine("system", "CHAT");
            addLine("info", "  /who               List users in channel");
            addLine(
              "info",
              "  /whois 0x...       Shows you information about a user"
            );
            addLine(
              "info",
              "  /whoami            Shows you information about yourself"
            );
            addLine("info", "  /msg message       Send message (or just type)");
            addLine("info", "  /clear             Clear screen");
            addLine("system", "REWARDS");
            addLine("info", "  /balance           Check claimable rewards");
            addLine("info", "  /claim             Claim creator rewards");
            addLine("system", "MODERATION");
            addLine("info", "  /mode              Show moderators & bans");
            addLine("info", "  /mode +o 0x...     Add moderator (owner only)");
            addLine(
              "info",
              "  /mode -o 0x...     Remove moderator (owner only)"
            );
            addLine("info", "  /mode +b 0x...     Ban user");
            addLine("info", "  /mode -b 0x...     Unban user");
            break;

          case "list":
            setIsLoading(true);
            try {
              const channels = await getAllChannels();

              if (channels.length === 0) {
                addLine(
                  "info",
                  "No channels found. Create one with /create #channel-name"
                );
              } else {
                // Add a single channelList line with all channels for front-end pagination
                const newLine: ChatLine = {
                  id: crypto.randomUUID(),
                  type: "channelList",
                  timestamp: new Date(),
                  content: `═══ Channels (${channels.length}) ═══`,
                  channels: channels.map((ch) => ({
                    slug: ch.slug,
                    memberCount: ch.memberCount,
                    messageCount: ch.messageCount,
                  })),
                };
                setLines((prev) => [...prev, newLine]);
              }
            } catch (err) {
              addLine("error", `Failed to list channels: ${err}`);
            }
            setIsLoading(false);
            break;

          case "join": {
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

              // Determine if user is moderator to show hidden messages
              const isMod =
                address &&
                (channelInfo.owner.toLowerCase() === address.toLowerCase() ||
                  moderators.some(
                    (m) => m.toLowerCase() === address.toLowerCase()
                  ));

              // Build message lines to add in batch (for proper scroll behavior)
              const messageLines: ChatLine[] = [];
              for (let i = 0; i < orderedMessages.length; i++) {
                const msg = orderedMessages[i];
                const msgIndex =
                  Number(channelInfo.messageCount) - orderedMessages.length + i;

                if (!msg.isHidden || isMod) {
                  messageLines.push({
                    id: `line-${lineIdCounter.current++}`,
                    type: "message",
                    timestamp: new Date(),
                    content: msg.content,
                    sender: formatAddress(msg.sender),
                    senderAddress: msg.sender,
                    channel: channelToJoin,
                    messageIndex: msgIndex,
                    isHidden: msg.isHidden,
                  });
                }
              }

              // Clear old messages and add new ones in a single update
              setLines((prev) => [
                ...prev.filter((l) => l.type !== "message"),
                ...messageLines,
              ]);

              // Signal to scroll to bottom after joining
              setScrollSignal((s) => s + 1);
            } catch (err: unknown) {
              const errorMessage = handleTransactionError(err);
              if (errorMessage !== null) {
                if (isUserRejectedError(err)) {
                  addLine("error", errorMessage);
                } else if (errorMessage.includes("ChannelNotFound")) {
                  console.warn(
                    `[OnChat] Channel "${channelToJoin}" does not exist.`
                  );
                  addLine(
                    "error",
                    `Channel #${channelToJoin} does not exist. Create it with /create #${channelToJoin}`
                  );
                } else {
                  addLine("error", `Failed to join channel: ${errorMessage}`);
                }
              }
            }
            setIsLoading(false);
            break;
          }

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
              const errorMessage = handleTransactionError(err);
              if (errorMessage !== null) {
                if (isUserRejectedError(err)) {
                  addLine("error", errorMessage);
                } else {
                  addLine("error", `Failed to leave channel: ${errorMessage}`);
                }
              }
            }
            setIsLoading(false);
            break;

          case "create": {
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
              const errorMessage = handleTransactionError(err);
              if (errorMessage !== null) {
                if (isUserRejectedError(err)) {
                  addLine("error", errorMessage);
                } else if (errorMessage.includes("ChannelAlreadyExists")) {
                  addLine(
                    "error",
                    `Channel #${newChannel} already exists. Use /join to join it.`
                  );
                } else {
                  addLine("error", `Failed to create channel: ${errorMessage}`);
                }
              }
            }
            setIsLoading(false);
            break;
          }

          case "who":
          case "names":
            if (!currentChannel) {
              addLine("error", "You are not in a channel");
              break;
            }

            setIsLoading(true);
            try {
              // Fetch profiles for all members to ensure we have them for the list
              await fetchUserProfilesBulk(members);
              // Add a single userList line with all members for front-end pagination
              const newLine: ChatLine = {
                id: crypto.randomUUID(),
                type: "userList",
                timestamp: new Date(),
                content: `═══ Users in #${currentChannel.slug} (${members.length}) ═══`,
                users: members,
              };
              setLines((prev) => [...prev, newLine]);
            } catch (err) {
              console.error("Failed to fetch profiles for /who:", err);
              // Fallback to just listing addresses if profile fetch fails
              addLine("info", members.map((m) => formatAddress(m)).join(" "));
            }
            setIsLoading(false);
            break;

          case "whoami":
            if (!isConnected || !address) {
              addLine("error", "Connect your wallet first");
              break;
            }
            addLine(
              "user",
              address,
              formatAddress(address),
              address,
              currentChannel?.slug
            );
            await handleWhois(address);
            break;

          case "whois": {
            if (args.length === 0) {
              addLine("error", "Usage: /whois 0xWalletAddress");
              break;
            }
            const target = args[0];
            if (!target.match(/^0x[a-fA-F0-9]{40}$/)) {
              addLine("error", "Invalid wallet address. Expected 0x...");
              break;
            }
            addLine(
              "user",
              target,
              formatAddress(target),
              target,
              currentChannel?.slug
            );
            await handleWhois(target);
            break;
          }

          case "msg":
          case "say": {
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
          }

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
              const errorMessage = handleTransactionError(err);
              if (errorMessage !== null) {
                if (isUserRejectedError(err)) {
                  addLine("error", errorMessage);
                } else {
                  addLine("error", `Failed to claim: ${errorMessage}`);
                }
              }
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

            if (args[argIndex]?.match(/^[+-][obh]$/i)) {
              modeFlag = args[argIndex].toLowerCase();
              argIndex++;
            }

            if (modeFlag === "+h" || modeFlag === "-h") {
              if (args[argIndex]?.match(/^\d+$/)) {
                targetWallet = args[argIndex]; // Reuse targetWallet for index
              }
            } else if (args[argIndex]?.match(/^0x[a-fA-F0-9]{40}$/)) {
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
                case "+h": {
                  // Hide message (owner/moderator)
                  const msgIndex = parseInt(targetWallet!);
                  addLine(
                    "action",
                    `Hiding message ${msgIndex} in #${channelSlug}...`
                  );
                  const tx = await hideMessage(
                    walletClient,
                    slugHash,
                    msgIndex
                  );
                  addLine(
                    "info",
                    "Transaction sent, waiting for confirmation..."
                  );
                  await waitForTransaction(tx);
                  addLine("system", `✓ Message ${msgIndex} has been hidden`);
                  break;
                }
                case "-h": {
                  // Unhide message (owner/moderator)
                  const msgIndex = parseInt(targetWallet!);
                  addLine(
                    "action",
                    `Unhiding message ${msgIndex} in #${channelSlug}...`
                  );
                  const tx = await unhideMessage(
                    walletClient,
                    slugHash,
                    msgIndex
                  );
                  addLine(
                    "info",
                    "Transaction sent, waiting for confirmation..."
                  );
                  await waitForTransaction(tx);
                  addLine("system", `✓ Message ${msgIndex} has been unhidden`);
                  break;
                }
                default:
                  addLine("error", `Unknown mode flag: ${modeFlag}`);
              }
            } catch (err: unknown) {
              const errorMessage = handleTransactionError(err);
              if (errorMessage !== null) {
                if (isUserRejectedError(err)) {
                  addLine("error", errorMessage);
                } else if (errorMessage.includes("NotChannelOwner")) {
                  addLine(
                    "error",
                    "Only the channel owner can add/remove moderators"
                  );
                } else if (
                  errorMessage.includes("NotChannelOwnerOrModerator")
                ) {
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
                  console.warn(
                    `[OnChat] Channel "${channelSlug}" does not exist.`
                  );
                  addLine("error", `Channel #${channelSlug} not found`);
                } else {
                  addLine("error", `Failed: ${errorMessage}`);
                }
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
        const tempId = `line-${lineIdCounter.current}`;
        try {
          // Show the message immediately (optimistic update)
          const msgIndex = Number(currentChannel.messageCount);
          addLine(
            "message",
            content,
            formatAddress(address!),
            address!,
            currentChannel.slug,
            msgIndex,
            false,
            true // isPending
          );

          const tx = await sendMessage(
            walletClient,
            currentChannel.slugHash,
            content
          );

          // Update the optimistic message with the transaction hash
          setLines((prev) =>
            prev.map((l) =>
              l.id === tempId ? { ...l, transactionHash: tx } : l
            )
          );

          // Track tx hash to avoid duplicate from event subscription if it arrives early
          processedTxHashes.current.add(tx);

          // Wait for confirmation
          await waitForTransaction(tx);

          // Note: isPending will be set to false by the onMessageSent event listener
          // or we can also set it here as a fallback in case the event listener is slow
          setLines((prev) =>
            prev.map((l) =>
              l.id === tempId && l.isPending ? { ...l, isPending: false } : l
            )
          );
        } catch (err: unknown) {
          // Remove the optimistic message if it failed to send
          setLines((prev) => prev.filter((l) => l.id !== tempId));

          const errorMessage = handleTransactionError(err);
          if (errorMessage !== null) {
            if (isUserRejectedError(err)) {
              addLine("error", errorMessage);
            } else {
              addLine("error", `Failed to send message: ${errorMessage}`);
            }
          }
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
      moderators,
      addLine,
      loadJoinedChannels,
      loadMembers,
    ]
  );

  const clearLines = useCallback(() => {
    setLines([]);
  }, []);

  const isUserModerator = !!(
    address &&
    currentChannel &&
    (currentChannel.owner.toLowerCase() === address.toLowerCase() ||
      moderators.some((m) => m.toLowerCase() === address.toLowerCase()))
  );

  return {
    lines,
    currentChannel,
    joinedChannels,
    members,
    moderators,
    isModerator: isUserModerator,
    isConnected,
    isWalletLoading,
    address,
    isLoading,
    isInitialChannelLoading,
    isLoadingChannels,
    scrollSignal,
    processCommand,
    clearLines,
    enterChannel,
  };
}
