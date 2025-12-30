export const APP_NAME = "OnChat";
export const APP_DESCRIPTION = "Fully permissionless, on-chain chat on Base";
export const APP_URL =
  import.meta.env.VITE_APP_URL || "https://onchat.sebayaki.com";

export const CONTRACTS = {
  ONCHAT_ADDRESS: "0x898D291C2160A9CB110398e9dF3693b7f2c4af2D",
  ONCHAT_BUYBACK_BURNER_ADDRESS: "0xb1fc1c145b758dc3cECE71F633b4cAB1a9A7c66d",
} as const;

// IRC-style constants
export const IRC_COLORS = {
  system: "#ffffff", // white for system messages
  error: "#ff6b6b", // red for errors
  info: "#0055ff", // bold blue for info
  action: "#ff9f43", // orange for actions
  timestamp: "#666666", // gray for timestamps
  nick: "#e056fd", // purple for nicknames
  channel: "#00ffff", // cyan for channel names
} as const;

export const MAX_MESSAGE_LENGTH = 500;
export const MESSAGES_PER_PAGE = 50;
