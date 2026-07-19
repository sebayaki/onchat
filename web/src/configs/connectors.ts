import { sdk } from "@farcaster/miniapp-sdk";
import { farcasterMiniApp } from "@farcaster/miniapp-wagmi-connector";
import type { EIP1193Provider } from "viem";

const FARCASTER_READ_TIMEOUT_MS = 3_000;
const FARCASTER_CONNECT_TIMEOUT_MS = 30_000;
const miniAppProvider = sdk.wallet.ethProvider;

function withProviderTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number
): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error("Farcaster wallet provider timed out."));
    }, timeoutMs);

    promise.then(resolve, reject).finally(() => clearTimeout(timeout));
  });
}

const farcasterProvider: EIP1193Provider = {
  async request(request) {
    const response = miniAppProvider.request(request as never);
    if (request.method === "eth_accounts" || request.method === "eth_chainId") {
      return withProviderTimeout(response, FARCASTER_READ_TIMEOUT_MS) as never;
    }
    if (request.method === "eth_requestAccounts") {
      return withProviderTimeout(
        response,
        FARCASTER_CONNECT_TIMEOUT_MS
      ) as never;
    }
    return response as never;
  },
  on(event, listener) {
    miniAppProvider.on(event as never, listener as never);
  },
  removeListener(event, listener) {
    miniAppProvider.removeListener(event as never, listener as never);
  },
};

function isFarcasterHostCandidate() {
  if (typeof window === "undefined") return false;

  const reactNativeWebView = (
    window as Window & { ReactNativeWebView?: unknown }
  ).ReactNativeWebView;

  return !!reactNativeWebView || window !== window.parent;
}

export async function isFarcasterWalletAvailable(): Promise<boolean> {
  if (!isFarcasterHostCandidate()) return false;

  try {
    await farcasterProvider.request({ method: "eth_accounts" });
    return true;
  } catch {
    return false;
  }
}

export function guardedFarcasterMiniApp() {
  const createFarcasterConnector = farcasterMiniApp();

  return (connectorConfig: Parameters<typeof createFarcasterConnector>[0]) => {
    const connector = createFarcasterConnector(connectorConfig);
    const connect = connector.connect.bind(connector);
    const isAuthorized = connector.isAuthorized.bind(connector);

    connector.connect = (async (
      ...parameters: Parameters<typeof connector.connect>
    ) => {
      if (!(await isFarcasterWalletAvailable())) {
        throw new Error("Farcaster Mini App wallet is unavailable.");
      }

      return connect(...parameters);
    }) as typeof connector.connect;
    connector.getProvider = async () => {
      if (!(await isFarcasterWalletAvailable())) {
        throw new Error("Farcaster Mini App wallet is unavailable.");
      }

      return farcasterProvider as never;
    };
    connector.isAuthorized = async () => {
      if (!(await isFarcasterWalletAvailable())) return false;
      return isAuthorized();
    };

    return connector;
  };
}
