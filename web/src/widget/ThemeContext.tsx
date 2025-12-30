/* eslint-disable react-refresh/only-export-components */
/**
 * Widget-specific ThemeContext
 *
 * This module provides a theme context for the widget that's compatible
 * with the main app's ThemeContext interface but doesn't sync with URL.
 *
 * Vite aliases @/context/ThemeContext to this file during widget build.
 */

import { createContext, useContext, type ReactNode } from "react";
import { themes, type Theme } from "../helpers/themes";

// Re-export constants for compatibility
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
];

export const CONTROL_VARS = {
  HIDE_MOBILE_TABS: "hide-mobile-tabs",
  HIDE_BRAND: "hide-brand",
};

// Theme context type (matches main app)
interface ThemeContextType {
  currentTheme: Theme;
  setTheme: (themeId: string) => void;
  themes: Theme[];
  hideMobileTabs: boolean;
  hideBrand: boolean;
  /** True when running as embedded widget - disables URL/history manipulation */
  isWidget: boolean;
}

// Create context with default values
export const ThemeContext = createContext<ThemeContextType>({
  currentTheme: themes[0],
  setTheme: () => {},
  themes,
  hideMobileTabs: false,
  hideBrand: false,
  isWidget: true,
});

// Widget options that can be set during mount
let widgetOptions: {
  theme?: string;
  hideMobileTabs?: boolean;
  hideBrand?: boolean;
} = {};

// Called by widget mount to set initial options
export function setWidgetThemeOptions(options: typeof widgetOptions) {
  widgetOptions = options;
}

// Theme provider for widget
export function ThemeProvider({ children }: { children: ReactNode }) {
  const currentTheme =
    themes.find((t) => t.id === widgetOptions.theme) || themes[0];

  const value: ThemeContextType = {
    currentTheme,
    setTheme: () => {}, // No-op in widget mode
    themes,
    hideMobileTabs: widgetOptions.hideMobileTabs ?? false,
    hideBrand: widgetOptions.hideBrand ?? false,
    isWidget: true,
  };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

// Hook to access theme context
export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
