export const APP_NAME = "OnChat";
export const APP_DESCRIPTION = "Fully permissionless, on-chain chat on Base";
export const APP_URL =
  import.meta.env.VITE_APP_URL || "https://onchat.sebayaki.com";

export const CONTRACTS = {
  ONCHAT_ADDRESS: "0x898D291C2160A9CB110398e9dF3693b7f2c4af2D",
  ONCHAT_BUYBACK_BURNER_ADDRESS: "0xb1fc1c145b758dc3cECE71F633b4cAB1a9A7c66d",
} as const;

export const MESSAGES_PER_PAGE = 30;

export const STORAGE_KEYS = {
  LAST_CHANNEL: "onchat_last_channel",
  LAST_READ_MESSAGES: "onchat_last_read_messages", // walletAddress -> { channelSlug -> lastReadMessageId }
} as const;
