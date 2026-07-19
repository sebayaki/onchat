import { useCallback } from "react";
import { getWalletClient as getCoreWalletClient } from "@wagmi/core";
import { useConnection } from "wagmi";
import { config } from "@/configs/wagmi";

export function useSyncedWalletClient() {
  const { address, connector, isConnected } = useConnection();

  const getWalletClient = useCallback(async () => {
    if (!isConnected || !address || !connector) return undefined;

    try {
      const client = await getCoreWalletClient(config, {
        account: address,
        connector,
      });

      return client.account.address.toLowerCase() === address.toLowerCase()
        ? client
        : undefined;
    } catch {
      return undefined;
    }
  }, [address, connector, isConnected]);

  return { getWalletClient };
}
