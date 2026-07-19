import { useCallback, useState } from "react";
import { useAccount, useConfig, useConnect } from "wagmi";
import { base } from "viem/chains";
import { isFarcasterWalletAvailable } from "@/configs/connectors";

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
      let connector = (await isFarcasterWalletAvailable())
        ? connectors.find((candidate) => candidate.id === "farcaster")
        : undefined;

      if (!connector) {
        for (const candidate of connectors) {
          if (candidate.type !== "injected") continue;

          const provider = await candidate.getProvider().catch(() => undefined);
          if (provider) {
            connector = candidate;
            break;
          }
        }
      }

      if (!connector) {
        window.alert(
          "No wallet provider found. Open this page in a supported wallet browser or Farcaster Mini App, or install a browser wallet extension."
        );
        return;
      }

      const currentStatus = config.state.status;
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
    isConnecting: isPending || isSelectingConnector,
  };
}
