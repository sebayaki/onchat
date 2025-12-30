import { http } from "@wagmi/core";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { base } from "@reown/appkit/networks";
import { farcasterMiniApp } from "@farcaster/miniapp-wagmi-connector";
import { injected, coinbaseWallet } from "wagmi/connectors";
import { createClient, fallback } from "viem";
import { BASE_RPC_ENDPOINTS } from "@/configs/rpcs";
import { APP_URL } from "@/configs/constants";

// Get projectId from environment variable
export const projectId = import.meta.env.VITE_REOWN_PROJECT_ID;

if (!projectId) {
  throw new Error("VITE_REOWN_PROJECT_ID is not defined");
}

export const networks = [base];

// Farcaster Mini App connector for embedded wallet support
export const farcasterConnector = farcasterMiniApp();

// Set up the Wagmi Adapter (Config)
// Reown AppKit handles wallet connections (WalletConnect, injected, etc.) automatically
// Farcaster connector is added for Mini App embedded wallet support
export const wagmiAdapter = new WagmiAdapter({
  projectId,
  networks,
  connectors: [
    farcasterConnector,
    injected(),
    coinbaseWallet({
      appName: "OnChat",
      appLogoUrl: `${APP_URL}/android-chrome-512x512.png`,
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

export const config = wagmiAdapter.wagmiConfig;
