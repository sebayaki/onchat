import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { themes, Theme } from "@/helpers/themes";

interface ThemeContextType {
  currentTheme: Theme;
  setTheme: (themeId: string) => void;
  themes: Theme[];
  hideMobileTabs: boolean;
  hideBrand: boolean;
  /** True when running as embedded widget - disables URL/history manipulation */
  isWidget: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

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

const THEME_VAR_IDS = THEME_VARS.map((v) => v.id);
const STORAGE_KEY = "onchat-theme-id";

export const CONTROL_VARS = {
  HIDE_MOBILE_TABS: "hide-mobile-tabs",
  HIDE_BRAND: "hide-brand",
};

function applyTheme(theme: Theme, overrides: Record<string, string>) {
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

  // Apply individual overrides from URL
  for (const key in overrides) {
    const value = overrides[key];
    if (value) {
      const formattedValue =
        value.length === 6 && !value.startsWith("#") ? `#${value}` : value;
      root.style.setProperty(`--${key}`, formattedValue);
    }
  }
}

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

  const currentTheme =
    themes.find((t) => t.id === urlState.themeId) || themes[0];

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
