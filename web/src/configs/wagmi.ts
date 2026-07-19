import { guardedFarcasterMiniApp } from "@/configs/connectors";
import { APP_URL } from "@/configs/constants";
import { BASE_RPC_ENDPOINTS } from "@/configs/rpcs";
import { createConfig, fallback, http, injected, type Config } from "wagmi";
import { baseAccount } from "wagmi/connectors";
import { createClient } from "viem";
import { base } from "viem/chains";

export const config: Config = createConfig({
  chains: [base],
  connectors: [
    injected({ shimDisconnect: true }),
    baseAccount({
      appName: "OnChat",
      appLogoUrl: `${APP_URL}/app-icon-200x200.png`,
    }),
    guardedFarcasterMiniApp(),
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
