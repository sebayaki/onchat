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
import { http, createClient, fallback } from "viem";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { createAppKit } from "@reown/appkit/react";
import { base } from "@reown/appkit/networks";
import { farcasterMiniApp } from "@farcaster/miniapp-wagmi-connector";
import { injected, coinbaseWallet } from "wagmi/connectors";

import { setWidgetThemeOptions } from "./ThemeContext";
import { themes, type Theme } from "../helpers/themes";
import { BASE_RPC_ENDPOINTS } from "../configs/rpcs";
import { renderWidget, type OnChatWidgetOptions } from "./WidgetComponents";

// Inline CSS - injected at build time by Vite
import widgetStyles from "./widget.css?inline";

// Re-export for external use
export type { OnChatWidgetOptions };

// Get project ID from Vite env or fallback
const getProjectId = () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const env = (import.meta as any).env || {};
  return env.VITE_REOWN_PROJECT_ID || "";
};

// Create wagmi adapter for widget
function createWidgetWagmiAdapter() {
  const projectId = getProjectId();

  if (!projectId) {
    console.error("OnChat Widget: VITE_REOWN_PROJECT_ID is not defined");
    return null;
  }

  return new WagmiAdapter({
    projectId,
    networks: [base],
    connectors: [
      farcasterMiniApp(),
      injected(),
      coinbaseWallet({
        appName: "OnChat Widget",
        appLogoUrl: "https://onchat.sebayaki.com/android-chrome-512x512.png",
      }),
    ],
    client({ chain }) {
      const transport = fallback(
        BASE_RPC_ENDPOINTS.map((url) =>
          http(url, {
            timeout: 2_000,
            retryCount: 0,
            batch: true,
          })
        ),
        { rank: false }
      );

      return createClient({
        chain,
        transport,
      });
    },
  });
}

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

  // Create wagmi adapter
  const wagmiAdapter = createWidgetWagmiAdapter();

  if (!wagmiAdapter) {
    throw new Error("OnChat: Failed to create wagmi adapter");
  }

  // Initialize AppKit
  const projectId = getProjectId();
  createAppKit({
    adapters: [wagmiAdapter],
    projectId,
    networks: [base],
    defaultNetwork: base,
    metadata: {
      name: "OnChat Widget",
      description: "Embeddable on-chain chat",
      url: window.location.origin,
      icons: ["https://onchat.sebayaki.com/android-chrome-192x192.png"],
    },
    features: {
      analytics: false,
      email: false,
      socials: false,
      onramp: false,
      swaps: false,
      send: false,
      history: false,
    },
    themeMode: "dark",
    themeVariables: {
      "--w3m-accent": "#0066ff",
      "--w3m-color-mix": "#000000",
      "--w3m-color-mix-strength": 40,
      "--w3m-border-radius-master": "0px",
      "--w3m-z-index": 10000,
    },
  });

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
