/**
 * Custom Farcaster Mini App Connector that uses window.top for communication
 *
 * This fixes the nested iframe issue where the default SDK uses window.parent,
 * which points to the intermediate frame instead of the Farcaster host.
 */

import { createConnector } from "@wagmi/core";
import { getAddress, numberToHex, type Hex } from "viem";

// Simple ID generator for RPC requests
let requestId = 0;
const getRequestId = () => ++requestId;

// Pending requests map
const pendingRequests = new Map<
  number,
  { resolve: (value: unknown) => void; reject: (error: Error) => void }
>();

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

// Set up message listener for responses (only once)
let listenerSetup = false;
function setupMessageListener() {
  if (listenerSetup || typeof window === "undefined") return;
  listenerSetup = true;

  window.addEventListener("message", (event) => {
    // Handle Comlink-style responses from Farcaster
    if (event.data && typeof event.data === "object") {
      const data = event.data;

      // Debug: log all messages
      if (data.type?.includes("frame") || data.id !== undefined) {
        console.log("[Farcaster Connector] Received message:", data);
      }

      // Handle direct response format
      if (typeof data.id === "number" && pendingRequests.has(data.id)) {
        const { resolve, reject } = pendingRequests.get(data.id)!;
        pendingRequests.delete(data.id);

        if (data.error) {
          reject(new Error(data.error.message || JSON.stringify(data.error)));
        } else {
          resolve(data.result);
        }
        return;
      }

      // Handle Farcaster frame response format
      if (
        data.type === "fc:frame:ethProviderResponse" &&
        pendingRequests.has(data.requestId)
      ) {
        const { resolve, reject } = pendingRequests.get(data.requestId)!;
        pendingRequests.delete(data.requestId);

        if (data.error) {
          reject(new Error(data.error.message || JSON.stringify(data.error)));
        } else {
          resolve(data.result);
        }
        return;
      }
    }
  });
}

// Send RPC request to Farcaster host
async function sendRequest(method: string, params?: unknown): Promise<unknown> {
  setupMessageListener();

  const targetWindow = getTargetWindow();
  const id = getRequestId();

  console.log("[Farcaster Connector] Sending request:", { id, method, params });

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      pendingRequests.delete(id);
      console.error("[Farcaster Connector] Request timeout:", method);
      reject(new Error(`Request timeout: ${method}`));
    }, 30000);

    pendingRequests.set(id, {
      resolve: (value) => {
        clearTimeout(timeout);
        console.log("[Farcaster Connector] Request resolved:", {
          id,
          method,
          value,
        });
        resolve(value);
      },
      reject: (error) => {
        clearTimeout(timeout);
        console.error("[Farcaster Connector] Request rejected:", {
          id,
          method,
          error,
        });
        reject(error);
      },
    });

    // Try multiple message formats that Farcaster might accept

    // Format 1: Farcaster frame format
    targetWindow.postMessage(
      {
        type: "fc:frame:ethProviderRequest",
        requestId: id,
        request: { method, params },
      },
      "*"
    );

    // Format 2: Comlink-style format (backup)
    targetWindow.postMessage(
      {
        id,
        type: "CALL",
        path: ["ethProviderRequestV2"],
        argumentList: [{ id, method, params }],
      },
      "*"
    );
  });
}

// The actual connector
export function farcasterMiniAppCustom() {
  return createConnector((config) => {
    // Provider implementation
    const provider = {
      async request({
        method,
        params,
      }: {
        method: string;
        params?: unknown[];
      }): Promise<unknown> {
        return sendRequest(method, params);
      },
    };

    return {
      id: "farcaster",
      name: "Farcaster",
      type: "farcasterMiniApp" as const,

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      async connect({ chainId } = {}): Promise<any> {
        console.log("[Farcaster Connector] Connecting...");

        const accounts = (await provider.request({
          method: "eth_requestAccounts",
        })) as string[];

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
        const accounts = (await provider.request({
          method: "eth_accounts",
        })) as string[];
        return accounts.map((x) => getAddress(x));
      },

      async getChainId() {
        const hexChainId = (await provider.request({
          method: "eth_chainId",
        })) as Hex;
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

        await provider.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: numberToHex(chainId) }],
        });

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
        return provider;
      },
    };
  });
}
