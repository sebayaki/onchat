import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { themes } from "@/helpers/themes";
import {
  THEME_VARS,
  THEME_VAR_IDS,
  CONTROL_VARS,
  applyTheme,
  getThemeById,
  type ThemeContextType,
} from "@/helpers/theme-shared";

// Re-export for consumers
export { THEME_VARS, CONTROL_VARS, type ThemeContextType };

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const STORAGE_KEY = "onchat-theme-id";

function parseUrlState() {
  if (typeof window === "undefined") {
    return {
      themeId: null as string | null,
      hideMobileTabs: false,
      hideBrand: false,
      overrides: {} as Record<string, string>,
    };
  }

  const params = new URLSearchParams(window.location.search);
  const overrides: Record<string, string> = {};

  for (const id of THEME_VAR_IDS) {
    const val = params.get(id);
    if (val) overrides[id] = val;
  }

  // Priority: URL param > localStorage
  const themeId = params.get("theme") || localStorage.getItem(STORAGE_KEY);

  return {
    themeId,
    hideMobileTabs: params.get(CONTROL_VARS.HIDE_MOBILE_TABS) === "true",
    hideBrand: params.get(CONTROL_VARS.HIDE_BRAND) === "true",
    overrides,
  };
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [urlState, setUrlState] = useState(parseUrlState);

  // Listen to URL changes (popstate for browser back/forward, pushstate-changed for theme changes)
  useEffect(() => {
    const updateUrl = () => {
      setUrlState(parseUrlState());
    };

    window.addEventListener("popstate", updateUrl);
    window.addEventListener("pushstate-changed", updateUrl);

    return () => {
      window.removeEventListener("popstate", updateUrl);
      window.removeEventListener("pushstate-changed", updateUrl);
    };
  }, []);

  const currentTheme = getThemeById(urlState.themeId);

  // Apply theme whenever it changes
  useEffect(() => {
    applyTheme(currentTheme, urlState.overrides);
  }, [currentTheme, urlState.overrides]);

  const setTheme = useCallback((id: string) => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    params.set("theme", id);
    // Clear individual overrides when switching presets
    for (const varId of THEME_VAR_IDS) {
      params.delete(varId);
    }

    // Save to localStorage
    localStorage.setItem(STORAGE_KEY, id);

    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.pushState({}, "", newUrl);
    window.dispatchEvent(new Event("pushstate-changed"));
  }, []);

  return (
    <ThemeContext.Provider
      value={{
        currentTheme,
        setTheme,
        themes,
        hideMobileTabs: urlState.hideMobileTabs,
        hideBrand: urlState.hideBrand,
        isWidget: false,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
