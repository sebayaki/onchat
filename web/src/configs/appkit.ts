import { createAppKit } from "@reown/appkit/react";
import { base } from "@reown/appkit/networks";
import { wagmiAdapter, projectId } from "./wagmi";
import { APP_NAME, APP_DESCRIPTION, APP_URL } from "./constants";

let initialized = false;

/**
 * Initialize Reown AppKit once.
 * Reuses the same Wagmi adapter and project configuration across the app and widgets.
 */
export const initializeAppKit = (isWidget = false) => {
  if (initialized) {
    return;
  }

  createAppKit({
    adapters: [wagmiAdapter],
    projectId,
    networks: [base],
    defaultNetwork: base,
    metadata: {
      name: isWidget ? `${APP_NAME} Widget` : APP_NAME,
      description: APP_DESCRIPTION,
      url: typeof window !== "undefined" ? window.location.origin : APP_URL,
      icons: [`${APP_URL}/android-chrome-192x192.png`],
    },
    features: {
      analytics: !isWidget,
      email: false,
      socials: false,
      onramp: !isWidget,
      swaps: false,
      send: false,
      history: false,
    },
    themeMode: "dark",
    themeVariables: {
      "--w3m-accent": "#0066ff",
      "--w3m-color-mix": "#000000",
      "--w3m-color-mix-strength": 40,
      "--w3m-font-family": "'IBM Plex Mono', 'Fira Code', monospace",
      "--w3m-border-radius-master": "0px",
      "--w3m-z-index": 10000,
    },
  });

  initialized = true;
};
