import { cookieStorage, createStorage, http } from "@wagmi/core";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { base } from "@reown/appkit/networks";
import { farcasterMiniApp } from "@farcaster/miniapp-wagmi-connector";
import { injected, coinbaseWallet } from "wagmi/connectors";
import { createClient, fallback } from "viem";
import { BASE_RPC_ENDPOINTS } from "@/configs/rpcs";
import { APP_URL } from "@/configs/constants";

// Get projectId from environment variable
export const projectId = process.env.NEXT_PUBLIC_REOWN_PROJECT_ID;

if (!projectId) {
  throw new Error("NEXT_PUBLIC_REOWN_PROJECT_ID is not defined");
}

export const networks = [base];

// Farcaster Mini App connector for embedded wallet support
export const farcasterConnector = farcasterMiniApp();

// Check if running in an iframe (third-party context)
// In iframes, cookies may be blocked, so we use localStorage instead
const isInIframe = typeof window !== "undefined" && window.self !== window.top;

// Create a storage adapter that works in iframe contexts
// localStorage works in iframes while third-party cookies are often blocked
const storageAdapter = isInIframe
  ? {
      getItem: (key: string) => {
        if (typeof window === "undefined") return null;
        return window.localStorage.getItem(key);
      },
      setItem: (key: string, value: string) => {
        if (typeof window === "undefined") return;
        window.localStorage.setItem(key, value);
      },
      removeItem: (key: string) => {
        if (typeof window === "undefined") return;
        window.localStorage.removeItem(key);
      },
    }
  : cookieStorage;

// Set up the Wagmi Adapter (Config)
// Reown AppKit handles wallet connections (WalletConnect, injected, etc.) automatically
// Farcaster connector is added for Mini App embedded wallet support
export const wagmiAdapter = new WagmiAdapter({
  storage: createStorage({
    storage: storageAdapter,
  }),
  ssr: true,
  projectId,
  networks,
  connectors: [
    // In iframe context, don't use shimDisconnect as it may conflict with parent app's state
    injected({ shimDisconnect: !isInIframe }),
    coinbaseWallet({
      appName: "OnChat",
      appLogoUrl: `${APP_URL}/android-chrome-512x512.png`,
    }),
    farcasterConnector,
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

export const config = wagmiAdapter.wagmiConfig;
