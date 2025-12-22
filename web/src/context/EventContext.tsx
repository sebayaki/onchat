"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import { decodeEventLog, type Log } from "viem";
import { basePublicClient } from "@/configs/viem";
import { ONCHAT_ABI } from "@/configs/abis";
import { CONTRACTS } from "@/configs/constants";

// Configuration
const POLLING_INTERVAL = 2000; // 2 seconds between checks

// Event types
export interface MessageSentEvent {
  slugHash: `0x${string}`;
  sender: `0x${string}`;
  messageIndex: bigint;
  content: string;
  blockNumber: bigint;
  transactionHash: `0x${string}`;
}

export interface ChannelEvent {
  type: "created" | "joined" | "left";
  slugHash: `0x${string}`;
  slug?: string;
  user?: `0x${string}`;
  owner?: `0x${string}`;
  blockNumber: bigint;
  transactionHash: `0x${string}`;
}

export interface ModerationEvent {
  type:
    | "banned"
    | "unbanned"
    | "moderatorAdded"
    | "moderatorRemoved"
    | "messageHidden"
    | "messageUnhidden";
  slugHash: `0x${string}`;
  user?: `0x${string}`;
  messageIndex?: bigint;
  actor: `0x${string}`;
  blockNumber: bigint;
  transactionHash: `0x${string}`;
}

type EventListener<T> = (event: T) => void;

interface EventContextType {
  currentBlock: bigint;
  isMonitoring: boolean;
  // Subscribe to events
  onMessageSent: (listener: EventListener<MessageSentEvent>) => () => void;
  onChannelEvent: (listener: EventListener<ChannelEvent>) => () => void;
  onModerationEvent: (listener: EventListener<ModerationEvent>) => () => void;
}

const EventContext = createContext<EventContextType | null>(null);

export function useEvents() {
  const context = useContext(EventContext);
  if (!context) {
    throw new Error("useEvents must be used within EventProvider");
  }
  return context;
}

export function EventProvider({ children }: { children: ReactNode }) {
  const [currentBlock, setCurrentBlock] = useState<bigint>(BigInt(0));
  const [isMonitoring, setIsMonitoring] = useState(false);

  // Event listeners
  const messageListeners = useRef<Set<EventListener<MessageSentEvent>>>(
    new Set()
  );
  const channelListeners = useRef<Set<EventListener<ChannelEvent>>>(new Set());
  const moderationListeners = useRef<Set<EventListener<ModerationEvent>>>(
    new Set()
  );

  // Last processed block (persisted in localStorage)
  const lastProcessedBlock = useRef<bigint>(BigInt(0));
  const isInitialized = useRef(false);

  // Subscribe functions
  const onMessageSent = useCallback(
    (listener: EventListener<MessageSentEvent>) => {
      messageListeners.current.add(listener);
      return () => {
        messageListeners.current.delete(listener);
      };
    },
    []
  );

  const onChannelEvent = useCallback(
    (listener: EventListener<ChannelEvent>) => {
      channelListeners.current.add(listener);
      return () => {
        channelListeners.current.delete(listener);
      };
    },
    []
  );

  const onModerationEvent = useCallback(
    (listener: EventListener<ModerationEvent>) => {
      moderationListeners.current.add(listener);
      return () => {
        moderationListeners.current.delete(listener);
      };
    },
    []
  );

  // Process a single log
  const processLog = useCallback((log: Log) => {
    try {
      const decoded = decodeEventLog({
        abi: ONCHAT_ABI,
        data: log.data,
        topics: log.topics,
      });

      const blockNumber = log.blockNumber!;
      const transactionHash = log.transactionHash!;

      switch (decoded.eventName) {
        case "MessageSent": {
          const args = decoded.args as {
            slugHash: `0x${string}`;
            sender: `0x${string}`;
            messageIndex: bigint;
            content: string;
          };
          const event: MessageSentEvent = {
            ...args,
            blockNumber,
            transactionHash,
          };
          messageListeners.current.forEach((listener) => listener(event));
          break;
        }

        case "ChannelCreated": {
          const args = decoded.args as {
            slugHash: `0x${string}`;
            slug: string;
            owner: `0x${string}`;
          };
          const event: ChannelEvent = {
            type: "created",
            slugHash: args.slugHash,
            slug: args.slug,
            owner: args.owner,
            blockNumber,
            transactionHash,
          };
          channelListeners.current.forEach((listener) => listener(event));
          break;
        }

        case "ChannelJoined": {
          const args = decoded.args as {
            slugHash: `0x${string}`;
            user: `0x${string}`;
          };
          const event: ChannelEvent = {
            type: "joined",
            slugHash: args.slugHash,
            user: args.user,
            blockNumber,
            transactionHash,
          };
          channelListeners.current.forEach((listener) => listener(event));
          break;
        }

        case "ChannelLeft": {
          const args = decoded.args as {
            slugHash: `0x${string}`;
            user: `0x${string}`;
          };
          const event: ChannelEvent = {
            type: "left",
            slugHash: args.slugHash,
            user: args.user,
            blockNumber,
            transactionHash,
          };
          channelListeners.current.forEach((listener) => listener(event));
          break;
        }

        case "UserBanned": {
          const args = decoded.args as {
            slugHash: `0x${string}`;
            user: `0x${string}`;
            bannedBy: `0x${string}`;
          };
          const event: ModerationEvent = {
            type: "banned",
            slugHash: args.slugHash,
            user: args.user,
            actor: args.bannedBy,
            blockNumber,
            transactionHash,
          };
          moderationListeners.current.forEach((listener) => listener(event));
          break;
        }

        case "UserUnbanned": {
          const args = decoded.args as {
            slugHash: `0x${string}`;
            user: `0x${string}`;
            unbannedBy: `0x${string}`;
          };
          const event: ModerationEvent = {
            type: "unbanned",
            slugHash: args.slugHash,
            user: args.user,
            actor: args.unbannedBy,
            blockNumber,
            transactionHash,
          };
          moderationListeners.current.forEach((listener) => listener(event));
          break;
        }

        case "ModeratorAdded": {
          const args = decoded.args as {
            slugHash: `0x${string}`;
            moderator: `0x${string}`;
            addedBy: `0x${string}`;
          };
          const event: ModerationEvent = {
            type: "moderatorAdded",
            slugHash: args.slugHash,
            user: args.moderator,
            actor: args.addedBy,
            blockNumber,
            transactionHash,
          };
          moderationListeners.current.forEach((listener) => listener(event));
          break;
        }

        case "ModeratorRemoved": {
          const args = decoded.args as {
            slugHash: `0x${string}`;
            moderator: `0x${string}`;
            removedBy: `0x${string}`;
          };
          const event: ModerationEvent = {
            type: "moderatorRemoved",
            slugHash: args.slugHash,
            user: args.moderator,
            actor: args.removedBy,
            blockNumber,
            transactionHash,
          };
          moderationListeners.current.forEach((listener) => listener(event));
          break;
        }

        case "MessageHidden": {
          const args = decoded.args as {
            slugHash: `0x${string}`;
            messageIndex: bigint;
            hiddenBy: `0x${string}`;
          };
          const event: ModerationEvent = {
            type: "messageHidden",
            slugHash: args.slugHash,
            messageIndex: args.messageIndex,
            actor: args.hiddenBy,
            blockNumber,
            transactionHash,
          };
          moderationListeners.current.forEach((listener) => listener(event));
          break;
        }

        case "MessageUnhidden": {
          const args = decoded.args as {
            slugHash: `0x${string}`;
            messageIndex: bigint;
            unhiddenBy: `0x${string}`;
          };
          const event: ModerationEvent = {
            type: "messageUnhidden",
            slugHash: args.slugHash,
            messageIndex: args.messageIndex,
            actor: args.unhiddenBy,
            blockNumber,
            transactionHash,
          };
          moderationListeners.current.forEach((listener) => listener(event));
          break;
        }
      }
    } catch (error) {
      // Silently ignore decode errors (might be other events)
      console.debug("[EventContext] Failed to decode log:", error);
    }
  }, []);

  // Process blocks in a range
  const processBlocks = useCallback(
    async (fromBlock: bigint, toBlock: bigint): Promise<void> => {
      try {
        const logs = await basePublicClient.getLogs({
          address: CONTRACTS.ONCHAT_ADDRESS,
          fromBlock,
          toBlock,
        });

        if (logs.length > 0) {
          console.log(
            `[EventContext] Found ${logs.length} events in blocks ${fromBlock}-${toBlock}`
          );
          for (const log of logs) {
            processLog(log);
          }
        }
      } catch (error) {
        console.error(
          `[EventContext] Failed to get logs for blocks ${fromBlock}-${toBlock}:`,
          error
        );
        throw error;
      }
    },
    [processLog]
  );

  // Main monitoring loop - real-time only, no historical catch-up
  // (historical messages are loaded from contract state when joining channels)
  useEffect(() => {
    if (typeof window === "undefined") return;

    let isRunning = true;
    let timeoutId: NodeJS.Timeout;

    const monitor = async () => {
      if (!isRunning) return;

      try {
        // Get current block
        const latestBlock = await basePublicClient.getBlockNumber();
        setCurrentBlock(latestBlock);

        // Initialize: start from current block (no catch-up needed)
        if (!isInitialized.current) {
          lastProcessedBlock.current = latestBlock;
          isInitialized.current = true;
          setIsMonitoring(true);
          console.log(`[EventContext] Monitoring from block ${latestBlock}`);
        }

        // Process new blocks since last check
        if (latestBlock > lastProcessedBlock.current) {
          const fromBlock = lastProcessedBlock.current + BigInt(1);
          await processBlocks(fromBlock, latestBlock);
          lastProcessedBlock.current = latestBlock;
        }
      } catch (error) {
        console.error("[EventContext] Error in monitoring loop:", error);
      }

      // Schedule next poll
      if (isRunning) {
        timeoutId = setTimeout(monitor, POLLING_INTERVAL);
      }
    };

    // Start monitoring
    monitor();

    return () => {
      isRunning = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [processBlocks]);

  return (
    <EventContext.Provider
      value={{
        currentBlock,
        isMonitoring,
        onMessageSent,
        onChannelEvent,
        onModerationEvent,
      }}
    >
      {children}
    </EventContext.Provider>
  );
}
