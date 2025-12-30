/**
 * Custom Farcaster Mini App Connector that uses window.top for communication
 *
 * This fixes the nested iframe issue where the default SDK uses window.parent,
 * which points to the intermediate frame instead of the Farcaster host.
 *
 * Uses Comlink's message format to properly communicate with the Farcaster host.
 */

import { createConnector } from "@wagmi/core";
import { getAddress, numberToHex, type Hex } from "viem";
import { wrap } from "comlink";

// Get the target window for communication (prefer top, fallback to parent)
function getTargetWindow(): Window {
  if (typeof window === "undefined") {
    throw new Error("Window is not defined");
  }

  // Try window.top first (for nested iframes), fallback to parent
  try {
    if (window.top && window.top !== window) {
      console.log("[Farcaster Connector] Using window.top for communication");
      return window.top;
    }
  } catch (e) {
    console.warn("[Farcaster Connector] Cannot access window.top:", e);
  }

  if (window.parent && window.parent !== window) {
    console.log("[Farcaster Connector] Using window.parent for communication");
    return window.parent;
  }

  console.log("[Farcaster Connector] No parent/top found, using window");
  return window;
}

// Create a Comlink-compatible endpoint for window.top
function createTopWindowEndpoint() {
  const target = getTargetWindow();

  return {
    postMessage: (message: unknown, transfer?: Transferable[]) => {
      console.log("[Farcaster Connector] Sending Comlink message:", message);
      target.postMessage(message, "*", transfer || []);
    },
    addEventListener: (
      _type: string,
      listener: EventListenerOrEventListenerObject,
      options?: boolean | AddEventListenerOptions
    ) => {
      window.addEventListener("message", listener as EventListener, options);
    },
    removeEventListener: (
      _type: string,
      listener: EventListenerOrEventListenerObject,
      options?: boolean | EventListenerOptions
    ) => {
      window.removeEventListener("message", listener as EventListener, options);
    },
  };
}

// Create the miniAppHost proxy using Comlink with window.top
let miniAppHost: ReturnType<typeof createMiniAppHost> | null = null;

function createMiniAppHost() {
  const endpoint = createTopWindowEndpoint();
  return wrap<{
    ethProviderRequest: (request: unknown) => Promise<unknown>;
    ethProviderRequestV2: (request: unknown) => Promise<unknown>;
    context: Promise<unknown>;
    getCapabilities: () => Promise<string[]>;
  }>(endpoint as never);
}

function getMiniAppHost() {
  if (!miniAppHost) {
    miniAppHost = createMiniAppHost();
  }
  return miniAppHost;
}

// RPC request store for tracking requests
let requestId = 0;
const getRequestId = () => ++requestId;

// The provider that communicates with Farcaster
async function sendEthRequest(
  method: string,
  params?: unknown
): Promise<unknown> {
  const host = getMiniAppHost();
  const request = {
    id: getRequestId(),
    jsonrpc: "2.0",
    method,
    params: params ?? [],
  };

  console.log("[Farcaster Connector] Sending eth request:", request);

  try {
    // Try v2 first
    const response = await Promise.race([
      host.ethProviderRequestV2(request),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Request timeout")), 30000)
      ),
    ]);

    console.log("[Farcaster Connector] Response (v2):", response);

    // Parse response
    const parsed = response as {
      result?: unknown;
      error?: { message?: string };
    };
    if (parsed.error) {
      throw new Error(parsed.error.message || "Unknown error");
    }
    return parsed.result;
  } catch (e) {
    // Try v1 fallback
    if (e instanceof Error && e.message.includes("apply")) {
      console.log("[Farcaster Connector] Falling back to v1...");
      const response = await host.ethProviderRequest(request);
      console.log("[Farcaster Connector] Response (v1):", response);
      return response;
    }
    throw e;
  }
}

// The actual connector
export function farcasterMiniAppCustom() {
  return createConnector((config) => {
    return {
      id: "farcaster",
      name: "Farcaster",
      type: "farcasterMiniApp" as const,

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      async connect({ chainId } = {}): Promise<any> {
        console.log("[Farcaster Connector] Connecting...");

        const accounts = (await sendEthRequest(
          "eth_requestAccounts"
        )) as string[];

        console.log("[Farcaster Connector] Accounts:", accounts);

        let currentChainId = await this.getChainId();

        // Switch chain if needed
        if (chainId && currentChainId !== chainId) {
          const chain = await this.switchChain?.({ chainId });
          currentChainId = chain?.id ?? currentChainId;
        }

        return {
          accounts: accounts.map((x) => getAddress(x)),
          chainId: currentChainId,
        };
      },

      async disconnect() {
        console.log("[Farcaster Connector] Disconnecting...");
      },

      async getAccounts() {
        const accounts = (await sendEthRequest("eth_accounts")) as string[];
        return accounts.map((x) => getAddress(x));
      },

      async getChainId() {
        const hexChainId = (await sendEthRequest("eth_chainId")) as Hex;
        return parseInt(hexChainId, 16);
      },

      async isAuthorized() {
        try {
          const accounts = await this.getAccounts();
          return accounts.length > 0;
        } catch {
          return false;
        }
      },

      async switchChain({ chainId }) {
        const chain = config.chains.find((x) => x.id === chainId);

        if (!chain) {
          throw new Error(`Chain ${chainId} not found`);
        }

        await sendEthRequest("wallet_switchEthereumChain", [
          { chainId: numberToHex(chainId) },
        ]);

        config.emitter.emit("change", { chainId });

        return chain;
      },

      onAccountsChanged(accounts: string[]) {
        if (accounts.length === 0) {
          this.onDisconnect();
        } else {
          config.emitter.emit("change", {
            accounts: accounts.map((x) => getAddress(x)),
          });
        }
      },

      onChainChanged(chain: string) {
        const chainId = Number(chain);
        config.emitter.emit("change", { chainId });
      },

      async onDisconnect() {
        config.emitter.emit("disconnect");
      },

      async getProvider() {
        return {
          request: async ({
            method,
            params,
          }: {
            method: string;
            params?: unknown[];
          }) => {
            return sendEthRequest(method, params);
          },
        };
      },
    };
  });
}
