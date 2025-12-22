export const APP_NAME = "OnChat";
export const APP_DESCRIPTION = "Fully permissionless, on-chain chat on Base";
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://onch.at";

export const CONTRACTS = {
  ONCHAT_ADDRESS: "0x322974Eec5113bc011F4691aC15D2C1Ffac83505",
} as const;

// IRC-style constants
export const IRC_COLORS = {
  system: "#00ff00", // green for system messages
  error: "#ff6b6b", // red for errors
  info: "#6b9fff", // blue for info
  action: "#ff9f43", // orange for actions
  timestamp: "#666666", // gray for timestamps
  nick: "#e056fd", // purple for nicknames
  channel: "#1dd1a1", // teal for channel names
} as const;

export const MAX_MESSAGE_LENGTH = 500;
export const MESSAGES_PER_PAGE = 50;
