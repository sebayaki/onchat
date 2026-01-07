import { type ChatLine } from "@/hooks/useChat";
import { type FarcasterUserProfile } from "@/helpers/farcaster";
import { ChatLineComponent } from "./ChatLine";
import { parseReplyContent } from "@/helpers/chat";
import { RefObject, useMemo } from "react";
import { MESSAGES_PER_PAGE } from "@/configs/constants";

// Group messages with their replies
interface MessageWithReplies {
  message: ChatLine;
  replies: MessageWithReplies[];
}

function buildMessageTree(lines: ChatLine[]): MessageWithReplies[] {
  // Create a map of messageIndex -> ChatLine for messages
  const messagesByIndex = new Map<number, ChatLine>();
  const repliesMap = new Map<number, ChatLine[]>(); // parentIndex -> replies
  const topLevelMessages: ChatLine[] = [];

  // First pass: categorize lines
  for (const line of lines) {
    if (line.type === "message" && line.messageIndex !== undefined) {
      messagesByIndex.set(line.messageIndex, line);

      // Check if this message is a reply
      const { replyToIndex } = parseReplyContent(line.content);
      if (replyToIndex !== undefined && messagesByIndex.has(replyToIndex)) {
        // This is a reply to an existing message
        const existing = repliesMap.get(replyToIndex) || [];
        existing.push(line);
        repliesMap.set(replyToIndex, existing);
      } else {
        // Top-level message (not a reply, or reply to a message we don't have)
        topLevelMessages.push(line);
      }
    } else {
      // Non-message lines are always top-level
      topLevelMessages.push(line);
    }
  }

  // Build tree recursively
  function buildNode(line: ChatLine, depth: number = 0): MessageWithReplies {
    const replies: MessageWithReplies[] = [];

    if (line.type === "message" && line.messageIndex !== undefined) {
      const directReplies = repliesMap.get(line.messageIndex) || [];
      for (const reply of directReplies) {
        replies.push(buildNode(reply, depth + 1));
      }
    }

    return { message: line, replies };
  }

  return topLevelMessages.map((line) => buildNode(line, 0));
}

// Render a message and its replies recursively
function renderMessageWithReplies(
  node: MessageWithReplies,
  profiles: Record<string, FarcasterUserProfile | null>,
  isModerator: boolean,
  processCommand: (input: string) => Promise<void>,
  lastReadId: number | undefined,
  onReply:
    | ((messageIndex: number, content: string, senderAddress?: string) => void)
    | undefined,
  onChannelClick: ((slug: string) => void) | undefined,
  depth: number = 0
): React.ReactNode[] {
  const elements: React.ReactNode[] = [];
  const { message, replies } = node;

  elements.push(
    <ChatLineComponent
      key={message.id}
      line={message}
      profile={
        message.senderAddress
          ? profiles[message.senderAddress.toLowerCase()]
          : null
      }
      profiles={profiles}
      isModerator={isModerator}
      processCommand={processCommand}
      lastReadId={lastReadId}
      onReply={onReply}
      isReply={depth > 0}
      replyDepth={depth}
      onChannelClick={onChannelClick}
    />
  );

  // Render replies
  for (const reply of replies) {
    elements.push(
      ...renderMessageWithReplies(
        reply,
        profiles,
        isModerator,
        processCommand,
        lastReadId,
        onReply,
        onChannelClick,
        depth + 1
      )
    );
  }

  return elements;
}

export function MessageList({
  lines,
  profiles,
  messagesEndRef,
  messagesContainerRef,
  isModerator,
  processCommand,
  showChannelButtons,
  onBrowseChannels,
  onCreateChannel,
  hasMore,
  isLoadingMore,
  onLoadMore,
  lastReadId,
  onReply,
  onChannelClick,
}: {
  lines: ChatLine[];
  profiles: Record<string, FarcasterUserProfile | null>;
  messagesEndRef: RefObject<HTMLDivElement | null>;
  messagesContainerRef?: RefObject<HTMLDivElement | null>;
  isModerator: boolean;
  processCommand: (input: string) => Promise<void>;
  showChannelButtons?: boolean;
  onBrowseChannels?: () => void;
  onCreateChannel?: () => void;
  hasMore?: boolean;
  isLoadingMore?: boolean;
  onLoadMore?: () => void;
  lastReadId?: number;
  onReply?: (
    messageIndex: number,
    content: string,
    senderAddress?: string
  ) => void;
  onChannelClick?: (slug: string) => void;
}) {
  // Build message tree with replies grouped under their parent messages
  const messageTree = useMemo(() => buildMessageTree(lines), [lines]);

  return (
    <div
      ref={messagesContainerRef}
      className="flex-1 overflow-y-auto px-4 py-2 bg-[var(--bg-primary)] scrollbar-thin scrollbar-track-transparent scrollbar-thumb-[var(--bg-tertiary)] hover:scrollbar-thumb-[var(--bg-hover)]"
    >
      <div className="flex flex-col gap-[2px]">
        {hasMore && (
          <div className="flex justify-center py-2 mb-2 border-b border-[var(--bg-tertiary)]/50">
            <button
              onClick={onLoadMore}
              disabled={isLoadingMore}
              className="text-[var(--color-channel)] hover:text-[var(--primary)] transition-colors cursor-pointer font-mono text-[0.85rem] underline disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoadingMore
                ? "Loading more messages..."
                : `Load older messages (${MESSAGES_PER_PAGE} more)`}
            </button>
          </div>
        )}
        {messageTree.map((node) =>
          renderMessageWithReplies(
            node,
            profiles,
            isModerator,
            processCommand,
            lastReadId,
            onReply,
            onChannelClick,
            0
          )
        )}

        {/* Channel action buttons when connected but not in any channel */}
        {showChannelButtons && (
          <div className="chat-line text-[var(--color-info)] flex flex-col items-start">
            <div className="flex items-center">
              <span className="chat-prefix text-[var(--color-info)]">*</span>
              <span className="chat-content">
                Join a channel or create your own to start chatting
              </span>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              <button
                onClick={onBrowseChannels}
                className="bg-transparent border border-[var(--primary-muted)] text-[var(--primary)] px-[0.8rem] py-[0.4rem] font-mono text-[0.8rem] cursor-pointer flex items-center gap-2 transition-all hover:bg-[var(--bg-hover)] hover:border-[var(--primary)]"
              >
                <div className="w-2 h-2 rounded-full bg-[var(--color-channel)] opacity-80" />
                Browse Channels
              </button>
              <button
                onClick={onCreateChannel}
                className="bg-transparent border border-[var(--primary-muted)] text-[var(--primary)] px-[0.8rem] py-[0.4rem] font-mono text-[0.8rem] cursor-pointer flex items-center gap-2 transition-all hover:bg-[var(--bg-hover)] hover:border-[var(--primary)]"
              >
                <div className="w-2 h-2 rounded-full bg-[var(--primary)] opacity-50" />
                Create Channel
              </button>
            </div>
          </div>
        )}
      </div>
      <div ref={messagesEndRef} />
    </div>
  );
}
