import React, { ReactNode } from "react";
import { ChannelInfo } from "@/helpers/contracts";

interface WhoisChannelsProps {
  channelCount: bigint;
  channelDetails: {
    info: ChannelInfo;
    isMod: boolean;
  }[];
  addr: string;
}

export function WhoisChannels({
  channelCount,
  channelDetails,
  addr,
}: WhoisChannelsProps) {
  return (
    <span>
      Joined Channels ({channelCount.toString()}):{" "}
      {channelDetails.map(({ info, isMod }, index) => (
        <span key={info.slugHash}>
          #{info.slug}
          {info.owner.toLowerCase() === addr.toLowerCase() ? (
            <span className="text-[var(--color-action)]"> (owner)</span>
          ) : isMod ? (
            <span className="text-[var(--color-action)]"> (mode)</span>
          ) : null}
          {index < channelDetails.length - 1 ? ", " : ""}
        </span>
      ))}
      {channelCount > BigInt(10) && (
        <span> ... and {Number(channelCount) - 10} more</span>
      )}
    </span>
  );
}

export function renderWhoisChannels(props: WhoisChannelsProps): ReactNode {
  return React.createElement(WhoisChannels, props);
}
