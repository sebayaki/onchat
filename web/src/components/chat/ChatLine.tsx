"use client";

import Image from "next/image";
import BaseScanIcon from "@/assets/logos/basescan.svg";
import FarcasterIcon from "@/assets/logos/farcaster.svg";
import CopyButton from "../CopyButton";
import { type ChatLine } from "@/hooks/useChat";
import { type FarcasterUserProfile } from "@/helpers/farcaster";
import { formatTime } from "@/helpers/format";

export function ActionButtons({
  address,
  username,
  hideBasescan = false,
}: {
  address: string;
  username?: string;
  hideBasescan?: boolean;
}) {
  return (
    <div className="flex items-center">
      <CopyButton
        textToCopy={address}
        className="p-1 hover:bg-[var(--bg-tertiary)] rounded transition-colors hover:opacity-70 opacity-100 transition-opacity cursor-pointer"
        iconClassName="w-3.5 h-3.5"
      />
      {!hideBasescan && (
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
      )}
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
        {showActions && address && (
          <ActionButtons address={address} hideBasescan={isSidebar} />
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
        <Image
          src={profile.pfpUrl}
          alt={profile.username}
          width={16}
          height={16}
          className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full shrink-0"
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
        <ActionButtons
          address={address}
          username={profile.username}
          hideBasescan={isSidebar}
        />
      )}
    </span>
  );
}

export function ChatLineComponent({
  line,
  profile,
}: {
  line: ChatLine;
  profile?: FarcasterUserProfile | null;
}) {
  const timeStr = formatTime(line.timestamp);

  switch (line.type) {
    case "system": {
      const content = typeof line.content === "string" ? line.content : "";
      const hasNowTalking = content.includes("* Now talking in #");

      return (
        <div
          className={`chat-line ${
            hasNowTalking
              ? "text-[var(--color-channel)]"
              : "text-[var(--color-system)]"
          }`}
        >
          <span className="chat-timestamp">[{timeStr}]</span>
          <span className="chat-content">{line.content}</span>
        </div>
      );
    }
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
        <div className="chat-line chat-line-message text-[var(--primary)]">
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
