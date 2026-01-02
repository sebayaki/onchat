import { useState, ReactNode } from "react";
import { useAppKit, useAppKitAccount } from "@reown/appkit/react";
import BaseScanIcon from "@/assets/logos/basescan.svg?url";
import CopyButton from "../CopyButton";
import { ExternalLink } from "../ExternalLink";
import { type ChatLine, type ChannelListItem } from "@/hooks/useChat";
import { type FarcasterUserProfile } from "@/helpers/farcaster";
import { formatTime, formatAddress } from "@/helpers/format";
import { MESSAGES_PER_PAGE } from "@/configs/constants";

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

function MessageContent({ content }: { content: string | React.ReactNode }) {
  if (typeof content !== "string") {
    return <>{content}</>;
  }

  // Basic URL regex that matches http/https
  const parts = content.split(/(https?:\/\/[^\s]+)/g);

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
        return part;
      })}
    </>
  );
}

const ITEMS_PER_PAGE = MESSAGES_PER_PAGE;

function PaginatedList<T>({
  items,
  title,
  timeStr,
  renderItem,
  getKey,
}: {
  items: T[];
  title: string;
  timeStr: string;
  renderItem: (item: T) => ReactNode;
  getKey: (item: T) => string;
}) {
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);
  const hasMore = visibleCount < items.length;
  const visibleItems = items.slice(0, visibleCount);

  return (
    <div className="chat-line text-[var(--color-info)] flex flex-col items-start px-2 -mx-2">
      <div className="flex items-start min-w-0 w-full">
        <span className="chat-timestamp">[{timeStr}]</span>
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
  timeStr,
}: {
  channels: ChannelListItem[];
  title: string;
  timeStr: string;
}) {
  return (
    <PaginatedList
      items={channels}
      title={title}
      timeStr={timeStr}
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
  timeStr,
  profiles,
}: {
  users: string[];
  title: string;
  timeStr: string;
  profiles: ProfilesRecord;
}) {
  return (
    <PaginatedList
      items={users}
      title={title}
      timeStr={timeStr}
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
}: {
  line: ChatLine;
  profile?: FarcasterUserProfile | null;
  profiles?: ProfilesRecord;
  isModerator?: boolean;
  processCommand?: (input: string) => Promise<void>;
  lastReadId?: number;
}) {
  const { isConnected } = useAppKitAccount();
  const timeStr = formatTime(line.timestamp);

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
          <span className="chat-timestamp">[{timeStr}]</span>
          <span className="chat-content">
            <MessageContent content={line.content} />
          </span>
        </div>
      );
    }
    case "error":
      return (
        <div className="chat-line text-[var(--color-error)] px-2 -mx-2">
          <span className="chat-timestamp">[{timeStr}]</span>
          <span className="chat-prefix font-bold text-[var(--color-error)]">
            !
          </span>
          <span className="chat-content">
            <MessageContent content={line.content} />
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
            <span className="chat-timestamp">[{timeStr}]</span>
            <span className="chat-prefix text-[var(--color-info)]">*</span>
            <span className="chat-content min-w-0">
              <MessageContent content={line.content} />
            </span>
          </div>
          {isConnectLine && <ConnectButton />}
        </div>
      );
    }
    case "action":
      return (
        <div className="chat-line text-[var(--color-action)] px-2 -mx-2">
          <span className="chat-timestamp">[{timeStr}]</span>
          <span className="chat-prefix text-[var(--color-action)]">→</span>
          <span className="chat-content">
            <MessageContent content={line.content} />
          </span>
        </div>
      );
    case "command":
      return (
        <div className="chat-line text-[var(--color-content)] font-mono px-2 -mx-2">
          <span className="chat-timestamp">[{timeStr}]</span>
          <span className="text-[var(--color-channel)] mr-1">
            {line.channel ? `#${line.channel}>` : ">"}
          </span>
          <span className="chat-content">
            <MessageContent content={line.content} />
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

      return (
        <div
          className={`chat-line chat-line-message text-[var(--primary)] transition-colors duration-500 ${
            isHidden ? "opacity-50 italic" : ""
          } ${isPending ? "animate-blink" : ""} ${
            isUnread
              ? "bg-[var(--bg-tertiary)]! px-2 -mx-2 rounded-sm"
              : "px-2 -mx-2"
          }`}
        >
          <span className="chat-timestamp">[{timeStr}]</span>
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
            {isHidden ? (
              <>
                (Hidden) <MessageContent content={line.content} />
              </>
            ) : (
              <MessageContent content={line.content} />
            )}
          </span>
          {isModerator &&
            line.messageIndex !== undefined &&
            !isPending &&
            processCommand && (
              <button
                onClick={() =>
                  processCommand(
                    `/mode ${isHidden ? "-h" : "+h"} ${line.messageIndex}`
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
          <span className="chat-timestamp">[{timeStr}]</span>
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
          timeStr={timeStr}
        />
      ) : null;
    case "userList":
      return line.users ? (
        <UserListDisplay
          users={line.users}
          title={typeof line.content === "string" ? line.content : "Users"}
          timeStr={timeStr}
          profiles={profiles}
        />
      ) : null;
    default:
      return null;
  }
}
