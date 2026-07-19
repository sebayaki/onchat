import { sdk } from "@farcaster/miniapp-sdk";
import { farcasterMiniApp } from "@farcaster/miniapp-wagmi-connector";
import type { CreateConnectorFn } from "wagmi";

export function guardedFarcasterMiniApp(): CreateConnectorFn {
  const createFarcasterConnector = farcasterMiniApp();

  return (config) => {
    const connector = createFarcasterConnector(config);

    return {
      ...connector,
      async getProvider(parameters) {
        if (!(await sdk.isInMiniApp())) return undefined as never;
        return connector.getProvider(parameters);
      },
      async isAuthorized() {
        if (!(await sdk.isInMiniApp())) return false;
        return connector.isAuthorized();
      },
    };
  };
}
