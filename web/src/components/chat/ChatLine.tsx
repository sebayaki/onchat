import { useState, ReactNode } from "react";
import { useAppKit, useAppKitAccount } from "@reown/appkit/react";
import BaseScanIcon from "@/assets/logos/basescan.svg?url";
import CopyButton from "../CopyButton";
import { ExternalLink } from "../ExternalLink";
import { ReplyIcon } from "../Icons";
import { type ChatLine, type ChannelListItem } from "@/hooks/useChat";
import { type FarcasterUserProfile } from "@/helpers/farcaster";
import {
  formatTime,
  formatAddress,
  formatFullDateTime,
} from "@/helpers/format";
import { MESSAGES_PER_PAGE } from "@/configs/constants";
import { parseReplyContent } from "@/helpers/chat";

function Timestamp({ date }: { date: Date }) {
  const [showTooltip, setShowTooltip] = useState(false);
  const timeStr = formatTime(date);
  const fullDateTime = formatFullDateTime(date);

  return (
    <span
      className="chat-timestamp relative cursor-default"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      onTouchStart={() => setShowTooltip(true)}
      onTouchEnd={() => setShowTooltip(false)}
    >
      [{timeStr}]
      {showTooltip && (
        <span className="absolute left-0 bottom-full mb-1 px-2 py-1 bg-[var(--bg-tertiary)] text-[var(--primary)] text-[0.75rem] rounded shadow-lg whitespace-nowrap z-50 pointer-events-none">
          {fullDateTime}
        </span>
      )}
    </span>
  );
}

type ProfilesRecord = Record<string, FarcasterUserProfile | null>;

function CopyableAddress({
  displayText,
  fullAddress,
  className = "",
}: {
  displayText: string;
  fullAddress: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(fullAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <span className="relative inline-flex">
      <span
        onClick={handleCopy}
        className={`cursor-pointer hover:opacity-70 transition-opacity ${className}`}
      >
        {displayText}
      </span>
      {copied && (
        <span className="absolute inset-0 flex items-center justify-center bg-[var(--bg-tertiary)] text-[var(--primary)]! text-[0.7rem] rounded whitespace-nowrap pointer-events-none animate-fade-in-out z-10">
          COPIED
        </span>
      )}
    </span>
  );
}

export function ActionButtons({
  address,
  hideBasescan = false,
  className = "",
}: {
  address: string;
  hideBasescan?: boolean;
  className?: string;
}) {
  return (
    <div className={`flex items-center shrink-0 ${className}`}>
      <CopyButton
        textToCopy={address}
        className="p-1 hover:bg-[var(--bg-tertiary)] rounded transition-colors hover:opacity-70 opacity-100 transition-opacity cursor-pointer shrink-0"
        iconClassName="w-3.5 h-3.5"
      />
      {!hideBasescan && (
        <ExternalLink
          href={`https://basescan.org/address/${address}`}
          className="p-1 hover:bg-[var(--bg-tertiary)] rounded transition-colors hover:opacity-70 opacity-100 transition-opacity shrink-0"
        >
          <img
            src={BaseScanIcon}
            alt="BaseScan"
            width={14}
            height={14}
            className="w-3.5 h-3.5"
          />
        </ExternalLink>
      )}
    </div>
  );
}

export function UserDisplay({
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
    showFullAddress && address
      ? address
      : address
        ? formatAddress(address, !!profile)
        : formattedAddress;

  if (!profile) {
    return (
      <span
        className={`inline-flex items-center gap-1 ${
          isSidebar ? "min-w-0 flex-1" : ""
        } ${className}`}
      >
        <CopyableAddress
          displayText={displayAddress}
          fullAddress={address || formattedAddress}
          className={`text-[var(--color-nick)] ${
            isSidebar ? "truncate min-w-0" : ""
          }`}
        />
        {showActions && address && (
          <ActionButtons
            address={address}
            hideBasescan={isSidebar}
            className={isSidebar ? "ml-auto" : ""}
          />
        )}
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
        <img
          src={profile.pfpUrl}
          alt={profile.username}
          width={16}
          height={16}
          className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full shrink-0"
        />
      )}
      <ExternalLink
        href={`https://warpcast.com/${profile.username}`}
        className={`font-bold text-[var(--color-nick)]! hover:opacity-70 transition-opacity ${
          isSidebar ? "truncate max-w-[140px] min-w-0" : "shrink-0"
        }`}
      >
        @{profile.username}
      </ExternalLink>
      <span className="text-[var(--text-dim)] shrink-0">-</span>
      <CopyableAddress
        displayText={displayAddress}
        fullAddress={address || ""}
        className={`text-[var(--color-nick)] ${
          isSidebar ? "truncate min-w-0" : "shrink-0"
        }`}
      />
      {showActions && address && (
        <ActionButtons
          address={address}
          hideBasescan={isSidebar}
          className={isSidebar ? "ml-auto" : ""}
        />
      )}
    </span>
  );
}

function ConnectButton() {
  const { open } = useAppKit();
  const { isConnected } = useAppKitAccount();

  if (isConnected) return null;

  return (
    <button
      className="mt-2 bg-transparent border border-[var(--primary-muted)] text-[var(--primary)] px-[0.8rem] py-[0.4rem] font-mono text-[0.8rem] cursor-pointer flex items-center gap-2 transition-all hover:bg-[var(--bg-hover)] hover:border-[var(--primary)]"
      onClick={() => open()}
    >
      <div className="w-2 h-2 rounded-full bg-[var(--primary)] opacity-50" />
      Connect Wallet
    </button>
  );
}

function MessageContent({
  content,
  onChannelClick,
}: {
  content: string | React.ReactNode;
  onChannelClick?: (slug: string) => void;
}) {
  if (typeof content !== "string") {
    return <>{content}</>;
  }

  // Combined regex for URLs and channel links
  // Channel: #[a-z][a-z-]{0,19} (1-20 chars, starts with letter, contains only a-z and -)
  // URL: https?://[^\s]+
  const parts = content.split(
    /(https?:\/\/[^\s]+|#[a-z][a-z-]{0,19}(?![a-z-]))/g,
  );

  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith("http://") || part.startsWith("https://")) {
          return (
            <ExternalLink
              key={i}
              href={part}
              className="underline hover:opacity-80 transition-opacity"
            >
              {part}
            </ExternalLink>
          );
        }
        // Channel link: #channel-name (must start with a letter)
        if (part.match(/^#[a-z][a-z-]{0,19}$/)) {
          const slug = part.slice(1); // Remove the #
          return (
            <button
              key={i}
              onClick={() => onChannelClick?.(slug)}
              className="text-[var(--color-channel)] hover:underline cursor-pointer bg-transparent border-none p-0 font-inherit"
            >
              {part}
            </button>
          );
        }
        return part;
      })}
    </>
  );
}

const ITEMS_PER_PAGE = MESSAGES_PER_PAGE;

function PaginatedList<T>({
  items,
  title,
  date,
  renderItem,
  getKey,
}: {
  items: T[];
  title: string;
  date: Date;
  renderItem: (item: T) => ReactNode;
  getKey: (item: T) => string;
}) {
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);
  const hasMore = visibleCount < items.length;
  const visibleItems = items.slice(0, visibleCount);

  return (
    <div className="chat-line text-[var(--color-info)] flex flex-col items-start px-2 -mx-2">
      <div className="flex items-start min-w-0 w-full">
        <Timestamp date={date} />
        <span className="chat-prefix text-[var(--color-info)]">*</span>
        <span className="chat-content truncate flex-1">{title}</span>
      </div>
      {visibleItems.map((item) => (
        <div
          key={getKey(item)}
          className="flex items-start pl-[calc(var(--timestamp-width)+0.5rem)] min-w-0 w-full"
        >
          <span className="chat-prefix text-[var(--color-info)]">*</span>
          <div className="min-w-0 flex-1">{renderItem(item)}</div>
        </div>
      ))}
      {hasMore && (
        <div className="pl-[calc(var(--timestamp-width)+0.5rem)]">
          <button
            onClick={() => setVisibleCount((prev) => prev + ITEMS_PER_PAGE)}
            className="text-[var(--color-channel)] hover:text-[var(--primary)] transition-colors cursor-pointer font-mono text-[0.85rem] underline"
          >
            View more ({items.length - visibleCount} remaining)
          </button>
        </div>
      )}
    </div>
  );
}

function ChannelListDisplay({
  channels,
  title,
  date,
}: {
  channels: ChannelListItem[];
  title: string;
  date: Date;
}) {
  return (
    <PaginatedList
      items={channels}
      title={title}
      date={date}
      getKey={(ch) => ch.slug}
      renderItem={(ch) => (
        <span className="chat-content">
          #{ch.slug} - {ch.memberCount.toString()} users,{" "}
          {ch.messageCount.toString()} messages
        </span>
      )}
    />
  );
}

function UserListDisplay({
  users,
  title,
  date,
  profiles,
}: {
  users: string[];
  title: string;
  date: Date;
  profiles: ProfilesRecord;
}) {
  return (
    <PaginatedList
      items={users}
      title={title}
      date={date}
      getKey={(address) => address}
      renderItem={(address) => (
        <div className="min-w-0">
          <UserDisplay
            address={address}
            formattedAddress={formatAddress(address)}
            profile={profiles[address.toLowerCase()]}
            showFullAddress={true}
            showActions={true}
          />
        </div>
      )}
    />
  );
}

export function ChatLineComponent({
  line,
  profile,
  profiles = {},
  isModerator,
  processCommand,
  lastReadId,
  onReply,
  isReply = false,
  replyDepth = 0,
  onChannelClick,
}: {
  line: ChatLine;
  profile?: FarcasterUserProfile | null;
  profiles?: ProfilesRecord;
  isModerator?: boolean;
  processCommand?: (input: string) => Promise<void>;
  lastReadId?: number;
  onReply?: (
    messageIndex: number,
    content: string,
    senderAddress?: string,
  ) => void;
  isReply?: boolean;
  replyDepth?: number;
  onChannelClick?: (slug: string) => void;
}) {
  const { isConnected } = useAppKitAccount();
  // Parse reply content for display
  const { replyToIndex, displayContent } = parseReplyContent(line.content);
  const effectiveContent = isReply ? displayContent : line.content;

  switch (line.type) {
    case "system": {
      const content = typeof line.content === "string" ? line.content : "";
      const hasNowTalking = content.includes("* Now talking in #");

      return (
        <div
          className={`chat-line px-2 -mx-2 ${
            hasNowTalking
              ? "text-[var(--color-channel)]"
              : "text-[var(--color-system)]"
          }`}
        >
          <Timestamp date={line.timestamp} />
          <span className="chat-content">
            <MessageContent
              content={line.content}
              onChannelClick={onChannelClick}
            />
          </span>
        </div>
      );
    }
    case "error":
      return (
        <div className="chat-line text-[var(--color-error)] px-2 -mx-2">
          <Timestamp date={line.timestamp} />
          <span className="chat-prefix font-bold text-[var(--color-error)]">
            !
          </span>
          <span className="chat-content">
            <MessageContent
              content={line.content}
              onChannelClick={onChannelClick}
            />
          </span>
        </div>
      );
    case "info": {
      const isConnectLine =
        !isConnected &&
        line.content === "Connect your wallet to start chatting";
      return (
        <div className="chat-line text-[var(--color-info)] flex flex-col items-start px-2 -mx-2">
          <div className="flex items-start">
            <Timestamp date={line.timestamp} />
            <span className="chat-prefix text-[var(--color-info)]">*</span>
            <span className="chat-content min-w-0">
              <MessageContent
                content={line.content}
                onChannelClick={onChannelClick}
              />
            </span>
          </div>
          {isConnectLine && <ConnectButton />}
        </div>
      );
    }
    case "action":
      return (
        <div className="chat-line text-[var(--color-action)] px-2 -mx-2">
          <Timestamp date={line.timestamp} />
          <span className="chat-prefix text-[var(--color-action)]">→</span>
          <span className="chat-content">
            <MessageContent
              content={line.content}
              onChannelClick={onChannelClick}
            />
          </span>
        </div>
      );
    case "command":
      return (
        <div className="chat-line text-[var(--color-content)] font-mono px-2 -mx-2">
          <Timestamp date={line.timestamp} />
          <span className="text-[var(--color-channel)] mr-1">
            {line.channel ? `#${line.channel}>` : ">"}
          </span>
          <span className="chat-content">
            <MessageContent
              content={line.content}
              onChannelClick={onChannelClick}
            />
          </span>
        </div>
      );
    case "message": {
      const isHidden = line.isHidden;
      const isPending = line.isPending;
      const isUnread =
        line.messageIndex !== undefined &&
        lastReadId !== undefined &&
        line.messageIndex > lastReadId;

      // Get reply prefix indicator if this is a reply (showing which message it replies to)
      const replyPrefix =
        replyToIndex !== undefined && !isReply ? (
          <span className="text-[var(--text-dim)] mr-1">↩#{replyToIndex}</span>
        ) : null;

      return (
        <div
          className={`chat-line chat-line-message text-[var(--primary)] transition-colors duration-500 group ${
            isHidden ? "opacity-50 italic" : ""
          } ${isPending ? "animate-blink" : ""} ${
            isUnread
              ? "bg-[var(--bg-tertiary)]! px-2 -mx-2 rounded-sm"
              : "px-2 -mx-2"
          } ${isReply ? "pl-4 border-l-2 border-[var(--bg-tertiary)]" : ""}`}
          style={
            replyDepth > 0 ? { marginLeft: `${replyDepth * 16}px` } : undefined
          }
        >
          <Timestamp date={line.timestamp} />
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
          <span className="chat-content">
            {replyPrefix}
            {isHidden ? (
              <>
                (Hidden){" "}
                <MessageContent
                  content={effectiveContent}
                  onChannelClick={onChannelClick}
                />
              </>
            ) : (
              <MessageContent
                content={effectiveContent}
                onChannelClick={onChannelClick}
              />
            )}
          </span>
          {/* Reply button - shown for confirmed messages when not already a reply view */}
          {onReply &&
            line.messageIndex !== undefined &&
            !isPending &&
            !isHidden &&
            isConnected && (
              <button
                onClick={() => {
                  const contentStr =
                    typeof line.content === "string" ? line.content : "";
                  onReply(line.messageIndex!, contentStr, line.senderAddress);
                }}
                className="ml-1 p-0.5 text-[var(--text-dim)] hover:text-[var(--primary)] transition-colors cursor-pointer align-middle"
                style={{ verticalAlign: "middle" }}
                title="Reply to this message"
              >
                <ReplyIcon size={14} />
              </button>
            )}
          {isModerator &&
            line.messageIndex !== undefined &&
            !isPending &&
            processCommand && (
              <button
                onClick={() =>
                  processCommand(
                    `/mode ${isHidden ? "-h" : "+h"} ${line.messageIndex}`,
                  )
                }
                className="ml-2 text-[0.6rem] bg-transparent border border-[var(--bg-tertiary)] px-1 rounded hover:bg-[var(--bg-hover)] cursor-pointer align-middle transition-colors uppercase font-bold"
                style={{ verticalAlign: "middle" }}
              >
                {isHidden ? "Unhide" : "Hide"}
              </button>
            )}
        </div>
      );
    }
    case "user":
      return (
        <div className="chat-line text-[var(--color-info)] flex items-start px-2 -mx-2">
          <Timestamp date={line.timestamp} />
          <span className="chat-prefix text-[var(--color-info)]">*</span>
          <div className="min-w-0">
            <UserDisplay
              address={line.senderAddress}
              formattedAddress={line.sender || ""}
              profile={profile}
              showFullAddress={true}
              showActions={true}
            />
          </div>
        </div>
      );
    case "channelList":
      return line.channels ? (
        <ChannelListDisplay
          channels={line.channels}
          title={typeof line.content === "string" ? line.content : "Channels"}
          date={line.timestamp}
        />
      ) : null;
    case "userList":
      return line.users ? (
        <UserListDisplay
          users={line.users}
          title={typeof line.content === "string" ? line.content : "Users"}
          date={line.timestamp}
          profiles={profiles}
        />
      ) : null;
    default:
      return null;
  }
}
