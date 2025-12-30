/**
 * Shared theme constants, types, and utilities
 * Used by both main app and widget ThemeContext
 */

import type { Theme } from "./themes";
import { themes } from "./themes";

// Theme CSS variable definitions
export const THEME_VARS = [
  { id: "primary", label: "Primary Color" },
  { id: "primary-muted", label: "Primary Muted" },
  { id: "text-dim", label: "Text Dim" },
  { id: "color-system", label: "System Color" },
  { id: "color-error", label: "Error Color" },
  { id: "color-info", label: "Info Color" },
  { id: "color-action", label: "Action Color" },
  { id: "color-nick", label: "Nick Color" },
  { id: "color-channel", label: "Channel Color" },
  { id: "color-timestamp", label: "Timestamp Color" },
  { id: "color-content", label: "Content Color" },
  { id: "bg-primary", label: "Background Primary" },
  { id: "bg-secondary", label: "Background Secondary" },
  { id: "bg-tertiary", label: "Background Tertiary" },
  { id: "bg-hover", label: "Background Hover" },
] as const;

export const THEME_VAR_IDS = THEME_VARS.map((v) => v.id);

export const CONTROL_VARS = {
  HIDE_MOBILE_TABS: "hide-mobile-tabs",
  HIDE_BRAND: "hide-brand",
} as const;

// Theme context type
export interface ThemeContextType {
  currentTheme: Theme;
  setTheme: (themeId: string) => void;
  themes: Theme[];
  hideMobileTabs: boolean;
  hideBrand: boolean;
  /** True when running as embedded widget - disables URL/history manipulation */
  isWidget: boolean;
}

// Apply theme CSS variables to document root
export function applyTheme(
  theme: Theme,
  overrides: Record<string, string> = {}
) {
  if (typeof window === "undefined") return;
  const root = document.documentElement;

  const colors = theme.colors;
  root.style.setProperty("--primary", colors.primary);
  root.style.setProperty("--primary-muted", colors.primaryMuted);
  root.style.setProperty("--text-dim", colors.textDim);
  root.style.setProperty("--color-system", colors.colorSystem);
  root.style.setProperty("--color-error", colors.colorError);
  root.style.setProperty("--color-info", colors.colorInfo);
  root.style.setProperty("--color-action", colors.colorAction);
  root.style.setProperty("--color-nick", colors.colorNick);
  root.style.setProperty("--color-channel", colors.colorChannel);
  root.style.setProperty("--color-timestamp", colors.colorTimestamp);
  root.style.setProperty("--color-content", colors.colorContent);
  root.style.setProperty("--bg-primary", colors.bgPrimary);
  root.style.setProperty("--bg-secondary", colors.bgSecondary);
  root.style.setProperty("--bg-tertiary", colors.bgTertiary);
  root.style.setProperty("--bg-hover", colors.bgHover);

  // Apply individual overrides
  for (const key in overrides) {
    const value = overrides[key];
    if (value) {
      const formattedValue =
        value.length === 6 && !value.startsWith("#") ? `#${value}` : value;
      root.style.setProperty(`--${key}`, formattedValue);
    }
  }
}

// Get theme by ID, falling back to first theme
export function getThemeById(themeId: string | null | undefined): Theme {
  return themes.find((t) => t.id === themeId) || themes[0];
}
