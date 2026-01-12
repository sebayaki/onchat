import { ChannelInfo } from "@/helpers/contracts";

interface WhoisChannelsProps {
  channelDetails: {
    info: ChannelInfo;
    isMod: boolean;
  }[];
  addr: string;
  onChannelClick?: (slug: string) => void;
}

function ChannelLink({
  slug,
  onChannelClick,
}: {
  slug: string;
  onChannelClick?: (slug: string) => void;
}) {
  return (
    <button
      onClick={() => onChannelClick?.(slug)}
      className="text-[var(--color-channel)] hover:underline cursor-pointer bg-transparent border-none p-0 font-inherit"
    >
      #{slug}
    </button>
  );
}

function ChannelList({
  channels,
  onChannelClick,
}: {
  channels: { info: ChannelInfo; isMod: boolean }[];
  onChannelClick?: (slug: string) => void;
}) {
  return (
    <>
      {channels.map(({ info }, index) => (
        <span key={info.slugHash}>
          <ChannelLink slug={info.slug} onChannelClick={onChannelClick} />
          {index < channels.length - 1 ? ", " : ""}
        </span>
      ))}
    </>
  );
}

export function WhoisChannels({
  channelDetails,
  addr,
  onChannelClick,
}: WhoisChannelsProps) {
  const createdChannels = channelDetails.filter(
    ({ info }) => info.owner.toLowerCase() === addr.toLowerCase()
  );
  const joinedChannels = channelDetails.filter(
    ({ info }) => info.owner.toLowerCase() !== addr.toLowerCase()
  );

  return (
    <span className="flex flex-col gap-1">
      <span>
        Created Channels:{" "}
        {createdChannels.length > 0 ? (
          <ChannelList
            channels={createdChannels}
            onChannelClick={onChannelClick}
          />
        ) : (
          "None"
        )}
      </span>
      <span>
        Joined Channels:{" "}
        {joinedChannels.length > 0 ? (
          <ChannelList
            channels={joinedChannels}
            onChannelClick={onChannelClick}
          />
        ) : (
          "None"
        )}
      </span>
    </span>
  );
}
