export interface ThemeColors {
  primary: string;
  primaryMuted: string;
  textDim: string;
  colorSystem: string;
  colorError: string;
  colorInfo: string;
  colorAction: string;
  colorNick: string;
  colorChannel: string;
  colorTimestamp: string;
  colorContent: string;
  bgPrimary: string;
  bgSecondary: string;
  bgTertiary: string;
  bgHover: string;
}

export interface Theme {
  id: string;
  name: string;
  colors: ThemeColors;
}

export const themes: Theme[] = [
  {
    id: "base-blue",
    name: "Base Blue",
    colors: {
      primary: "#0066ff",
      primaryMuted: "#0044cc",
      textDim: "#555555",
      colorSystem: "#f8fafc",
      colorError: "#ff5c5c",
      colorInfo: "#3b82f6",
      colorAction: "#fbbf24",
      colorNick: "#e879f9",
      colorChannel: "#22d3ee",
      colorTimestamp: "#64748b",
      colorContent: "#cbd5e1",
      bgPrimary: "#0a0a0a",
      bgSecondary: "#111111",
      bgTertiary: "#1a1a1a",
      bgHover: "#222222",
    },
  },
  {
    id: "signet-purple",
    name: "Signet Purple",
    colors: {
      primary: "#8b5cf6",
      primaryMuted: "#6d28d9",
      textDim: "#6b7280",
      colorSystem: "#f9fafb",
      colorError: "#ef4444",
      colorInfo: "#38bdf8",
      colorAction: "#fbbf24",
      colorNick: "#f472b6",
      colorChannel: "#22d3ee",
      colorTimestamp: "#9ca3af",
      colorContent: "#e5e7eb",
      bgPrimary: "#09090b",
      bgSecondary: "#18181b",
      bgTertiary: "#27272a",
      bgHover: "#3f3f46",
    },
  },
  {
    id: "beeper-green",
    name: "Beeper Green",
    colors: {
      primary: "#75ff81",
      primaryMuted: "#4ade80",
      textDim: "#6b7280",
      colorSystem: "#e8ffe8",
      colorError: "#f87171",
      colorInfo: "#60a5fa",
      colorAction: "#facc15",
      colorNick: "#a78bfa",
      colorChannel: "#2dd4bf",
      colorTimestamp: "#9ca3af",
      colorContent: "#d1ffd6",
      bgPrimary: "#030712",
      bgSecondary: "#111827",
      bgTertiary: "#1f2937",
      bgHover: "#374151",
    },
  },
  {
    id: "reviewme-pink",
    name: "ReviewMe Pink",
    colors: {
      primary: "#ec4899",
      primaryMuted: "#be185d",
      textDim: "#9ca3af",
      colorSystem: "#fdf2f8",
      colorError: "#f87171",
      colorInfo: "#818cf8",
      colorAction: "#fbbf24",
      colorNick: "#fb7185",
      colorChannel: "#22d3ee",
      colorTimestamp: "#9ca3af",
      colorContent: "#fce7f3",
      bgPrimary: "#0f0a0d",
      bgSecondary: "#1a1218",
      bgTertiary: "#2d2230",
      bgHover: "#3d2d40",
    },
  },
  {
    id: "mintclub-mint",
    name: "Mint Club Mint",
    colors: {
      primary: "#15e6b7",
      primaryMuted: "#0fb892",
      textDim: "#9ca3af",
      colorSystem: "#e8fff9",
      colorError: "#f87171",
      colorInfo: "#3b82f6",
      colorAction: "#fbbf24",
      colorNick: "#f472b6",
      colorChannel: "#a3be8c",
      colorTimestamp: "#9ca3af",
      colorContent: "#d1ffef",
      bgPrimary: "#0a0f0e",
      bgSecondary: "#111a18",
      bgTertiary: "#1a2725",
      bgHover: "#2a3b38",
    },
  },
  {
    id: "hunttown-pink",
    name: "Hunt Town Pink",
    colors: {
      primary: "#fc7070",
      primaryMuted: "#cc5a5a",
      textDim: "#888888",
      colorSystem: "#ffffff",
      colorError: "#ff4444",
      colorInfo: "#38bdf8",
      colorAction: "#fbbf24",
      colorNick: "#75ff81",
      colorChannel: "#2dd4bf",
      colorTimestamp: "#888888",
      colorContent: "#eeeeee",
      bgPrimary: "#000000",
      bgSecondary: "#121212",
      bgTertiary: "#1e1e1e",
      bgHover: "#2a2a2a",
    },
  },
];
