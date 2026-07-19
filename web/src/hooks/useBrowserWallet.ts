import { useCallback } from "react";
import { useConnect } from "wagmi";

export function useBrowserWallet() {
  const { connectors, connectAsync, isPending } = useConnect();

  const connectWallet = useCallback(async () => {
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
      if ((error as { code?: number }).code !== 4001) {
        window.alert(
          error instanceof Error ? error.message : "Failed to connect wallet."
        );
      }
    }
  }, [connectAsync, connectors]);

  return { connectWallet, isConnecting: isPending };
}
