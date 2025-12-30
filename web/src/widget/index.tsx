/* eslint-disable react-refresh/only-export-components */
/**
 * OnChat Embeddable Widget
 *
 * This module exports a standalone widget that can be embedded on any webpage.
 * It creates an isolated React tree with its own wagmi/react-query context,
 * rendered inside a Shadow DOM for style isolation.
 *
 * Usage:
 *   <div id="onchat"></div>
 *   <script src="https://onchat.sebayaki.com/widget.js"></script>
 *   <script>
 *     OnChat.mount('#onchat', {
 *       channel: 'vibecoding',
 *       theme: 'classic-blue',
 *       hideBrand: true,
 *       hideMobileTabs: true,
 *       height: '600px'
 *     });
 *   </script>
 */

import type { Root } from "react-dom/client";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { wagmiAdapter as globalWagmiAdapter } from "../configs/wagmi";
import { initializeAppKit } from "../configs/appkit";

import { setWidgetThemeOptions } from "./ThemeContext";
import { themes, type Theme } from "../helpers/themes";
import { renderWidget, type OnChatWidgetOptions } from "./WidgetComponents";

// Inline CSS - injected at build time by Vite
import widgetStyles from "./widget.css?inline";

// Re-export for external use
export type { OnChatWidgetOptions };

// Apply theme CSS variables to shadow root host
function applyThemeToShadow(
  shadowRoot: ShadowRoot,
  theme: Theme,
  colorOverrides?: Record<string, string>
) {
  const host = shadowRoot.host as HTMLElement;

  const colors = theme.colors;
  host.style.setProperty("--primary", colors.primary);
  host.style.setProperty("--primary-muted", colors.primaryMuted);
  host.style.setProperty("--text-dim", colors.textDim);
  host.style.setProperty("--color-system", colors.colorSystem);
  host.style.setProperty("--color-error", colors.colorError);
  host.style.setProperty("--color-info", colors.colorInfo);
  host.style.setProperty("--color-action", colors.colorAction);
  host.style.setProperty("--color-nick", colors.colorNick);
  host.style.setProperty("--color-channel", colors.colorChannel);
  host.style.setProperty("--color-timestamp", colors.colorTimestamp);
  host.style.setProperty("--color-content", colors.colorContent);
  host.style.setProperty("--bg-primary", colors.bgPrimary);
  host.style.setProperty("--bg-secondary", colors.bgSecondary);
  host.style.setProperty("--bg-tertiary", colors.bgTertiary);
  host.style.setProperty("--bg-hover", colors.bgHover);

  // Apply custom color overrides
  if (colorOverrides) {
    for (const [key, value] of Object.entries(colorOverrides)) {
      if (value) {
        const formattedValue =
          value.length === 6 && !value.startsWith("#") ? `#${value}` : value;
        host.style.setProperty(`--${key}`, formattedValue);
      }
    }
  }
}

// Singleton state
let widgetInstance: {
  container: HTMLElement;
  shadowRoot: ShadowRoot;
  root: Root;
  wagmiAdapter: WagmiAdapter;
} | null = null;

/**
 * Mount the OnChat widget to a DOM element (singleton - only one widget can exist)
 */
export function mount(
  selector: string | HTMLElement,
  options: OnChatWidgetOptions = {}
): { unmount: () => void } {
  const container =
    typeof selector === "string"
      ? document.querySelector<HTMLElement>(selector)
      : selector;

  if (!container) {
    throw new Error(`OnChat: Could not find element: ${selector}`);
  }

  // Singleton: if already mounted on same container, return existing unmount
  if (widgetInstance && widgetInstance.container === container) {
    return { unmount };
  }

  // If mounted on different container, unmount first
  if (widgetInstance) {
    unmount();
  }

  // Set widget theme options before rendering
  setWidgetThemeOptions({
    theme: options.theme,
    hideMobileTabs: options.hideMobileTabs,
    hideBrand: options.hideBrand,
  });

  // Style the container
  container.style.width = "100%";
  container.style.height = options.height || "600px";
  container.style.display = "block";

  // Check if container already has a shadow root (reuse it)
  let shadowRoot = container.shadowRoot;
  if (!shadowRoot) {
    shadowRoot = container.attachShadow({ mode: "open" });
  } else {
    // Clear existing content for remount
    shadowRoot.innerHTML = "";
  }

  // Inject styles into shadow DOM
  const styleEl = document.createElement("style");
  styleEl.textContent = widgetStyles;
  shadowRoot.appendChild(styleEl);

  // Create mount point inside shadow DOM
  const mountPoint = document.createElement("div");
  mountPoint.id = "onchat-mount";
  mountPoint.style.width = "100%";
  mountPoint.style.height = "100%";
  shadowRoot.appendChild(mountPoint);

  // Initialize AppKit and get adapter
  initializeAppKit(true);
  const wagmiAdapter = globalWagmiAdapter;

  // Apply theme CSS variables to shadow root
  const theme = themes.find((t) => t.id === options.theme) || themes[0];
  applyThemeToShadow(shadowRoot, theme, options.colors);

  // Render widget
  const root = renderWidget(mountPoint, options, wagmiAdapter);

  // Store singleton instance
  widgetInstance = { container, shadowRoot, root, wagmiAdapter };

  return { unmount };
}

/**
 * Unmount the widget
 */
export function unmount(): boolean {
  if (!widgetInstance) {
    return false;
  }

  widgetInstance.root.unmount();
  widgetInstance.shadowRoot.innerHTML = "";
  widgetInstance = null;
  return true;
}

// Export as global for IIFE build
if (typeof window !== "undefined") {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).OnChat = {
    mount,
    unmount,
    themes,
  };
}

const OnChat = { mount, unmount, themes };
export default OnChat;
