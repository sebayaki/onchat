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
import { themes } from "../helpers/themes";
import {
  THEME_VARS,
  CONTROL_VARS,
  getThemeById,
  type ThemeContextType,
} from "../helpers/theme-shared";

// Re-export for consumers
export { THEME_VARS, CONTROL_VARS, type ThemeContextType };

// Create context with default values (widget can work without provider)
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
  const currentTheme = getThemeById(widgetOptions.theme);

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
