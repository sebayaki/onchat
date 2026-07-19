import { useCallback, useState } from "react";
import { sdk } from "@farcaster/miniapp-sdk";
import { getConnection } from "@wagmi/core";
import { useAccount, useConfig, useConnect } from "wagmi";
import { base } from "viem/chains";

let isConnectionRequestInFlight = false;

export function useBrowserWallet() {
  const config = useConfig();
  const { connectors, connectAsync, isPending } = useConnect();
  const { status } = useAccount();
  const [isSelectingConnector, setIsSelectingConnector] = useState(false);

  const connectWallet = useCallback(async () => {
    if (
      isConnectionRequestInFlight ||
      status === "connected" ||
      status === "connecting"
    ) {
      return;
    }

    isConnectionRequestInFlight = true;
    setIsSelectingConnector(true);

    try {
      const isFarcasterMiniApp = await sdk.isInMiniApp();
      let connector = isFarcasterMiniApp
        ? connectors.find((candidate) => candidate.id === "farcaster")
        : undefined;

      for (const candidate of connectors) {
        if (
          connector ||
          candidate.id === "farcaster" ||
          candidate.id === "baseAccount"
        ) {
          continue;
        }

        const provider = await candidate.getProvider().catch(() => undefined);
        if (provider) {
          connector = candidate;
          break;
        }
      }

      connector ??= connectors.find(
        (candidate) => candidate.id === "baseAccount"
      );

      if (!connector) {
        window.alert(
          "No wallet provider found. Install a browser wallet or use Base Account."
        );
        return;
      }

      const currentStatus = getConnection(config).status;
      if (currentStatus === "connected" || currentStatus === "connecting") {
        return;
      }

      await connectAsync({ connector, chainId: base.id });
    } catch (error) {
      if (
        (error as { name?: string }).name === "ConnectorAlreadyConnectedError"
      ) {
        return;
      }

      if ((error as { code?: number }).code !== 4001) {
        window.alert(
          error instanceof Error ? error.message : "Failed to connect wallet."
        );
      }
    } finally {
      isConnectionRequestInFlight = false;
      setIsSelectingConnector(false);
    }
  }, [config, connectAsync, connectors, status]);

  return {
    connectWallet,
    isConnecting: isSelectingConnector || isPending,
  };
}
