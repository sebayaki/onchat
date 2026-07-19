import { useCallback } from "react";
import { useAccount, useConnect } from "wagmi";

export function useBrowserWallet() {
  const { connectors, connectAsync, isPending } = useConnect();
  const { status } = useAccount();
  const isAccountPending =
    status === "connecting" || status === "reconnecting";

  const connectWallet = useCallback(async () => {
    if (status !== "disconnected") return;

    try {
      let connector = null;
      for (const candidate of connectors) {
        const provider = await candidate.getProvider().catch(() => undefined);
        if (provider) {
          connector = candidate;
          break;
        }
      }

      if (!connector) {
        window.alert(
          "No wallet provider found. Open this page in a Farcaster Mini App or install a browser wallet extension."
        );
        return;
      }

      await connectAsync({ connector });
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
    }
  }, [connectAsync, connectors, status]);

  return {
    connectWallet,
    isConnecting: isPending || isAccountPending,
  };
}
