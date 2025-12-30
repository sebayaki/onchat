/* eslint-disable react-refresh/only-export-components */
/**
 * Widget-specific ThemeContext
 *
 * This module provides a theme context for the widget that's compatible
 * with the main app's ThemeContext interface but doesn't sync with URL.
 *
 * Vite aliases @/context/ThemeContext to this file during widget build.
 */

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  type ReactNode,
} from "react";
import {
  themes,
  ThemeContextType,
  THEME_VARS,
  CONTROL_VARS,
  applyThemeVars,
} from "../helpers/themes";

// Re-export for compatibility
export { THEME_VARS, CONTROL_VARS };

// Create context with default values
export const ThemeContext = createContext<ThemeContextType | undefined>(
  undefined
);

// Widget options that can be set during mount
let widgetOptions: {
  theme?: string;
  hideMobileTabs?: boolean;
  hideBrand?: boolean;
  colors?: Record<string, string>;
} = {};

// Called by widget mount to set initial options
export function setWidgetThemeOptions(options: typeof widgetOptions) {
  widgetOptions = options;
}

// Theme provider for widget
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeId, setThemeId] = useState(widgetOptions.theme);

  const currentTheme = useMemo(
    () => themes.find((t) => t.id === themeId) || themes[0],
    [themeId]
  );

  // Apply theme whenever it changes
  useEffect(() => {
    // In widget context, we apply theme to the shadow host
    // We can find the shadow host by looking up from the current script context
    // or by targeting the .onchat-widget-root if we had a ref.
    // However, since we're in Shadow DOM, we can just find the root
    const root = document.querySelector("#onchat-mount")?.parentElement;
    if (root instanceof ShadowRoot) {
      applyThemeVars(
        root.host as HTMLElement,
        currentTheme,
        widgetOptions.colors
      );
    } else {
      // Fallback to document element if not in shadow DOM (e.g. during dev)
      applyThemeVars(
        document.documentElement,
        currentTheme,
        widgetOptions.colors
      );
    }
  }, [currentTheme]);

  const value: ThemeContextType = {
    currentTheme,
    setTheme: setThemeId,
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
