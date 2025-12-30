"use client";

import { wagmiAdapter, projectId } from "@/configs/wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createAppKit } from "@reown/appkit/react";
import { base } from "@reown/appkit/networks";
import {
  type ReactNode,
  useState,
  useEffect,
  useCallback,
  useRef,
  createContext,
  useContext,
} from "react";
import { WagmiProvider, type Config, useConnect, useConnectors } from "wagmi";
import { useAppKitAccount } from "@reown/appkit/react";
import { APP_URL, APP_NAME, APP_DESCRIPTION } from "@/configs/constants";
import { EventProvider } from "./EventContext";
import { ThemeProvider } from "./ThemeContext";
import { sdk } from "@farcaster/miniapp-sdk";

if (!projectId) {
  throw new Error("Project ID is not defined");
}

// Set up metadata
const getCurrentOrigin = () => {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return APP_URL;
};

const currentOrigin = getCurrentOrigin();
const metadata = {
  name: APP_NAME,
  description: APP_DESCRIPTION,
  url: currentOrigin,
  icons: [`${currentOrigin}/android-chrome-192x192.png`],
};

// Create the modal
createAppKit({
  adapters: [wagmiAdapter],
  projectId,
  networks: [base],
  defaultNetwork: base,
  metadata: metadata,
  features: {
    analytics: true,
    email: false,
    socials: false,
    onramp: true,
    swaps: false,
    send: false,
    history: false,
  },
  themeMode: "dark",
  themeVariables: {
    "--w3m-accent": "#0066ff",
    "--w3m-color-mix": "#000000",
    "--w3m-color-mix-strength": 40,
    "--w3m-font-family": "'IBM Plex Mono', 'Fira Code', monospace",
    "--w3m-border-radius-master": "0px",
    "--w3m-z-index": 10000,
  },
});

// Farcaster context type
interface FarcasterContextType {
  isInMiniApp: boolean;
  isSDKLoaded: boolean;
  connectFarcasterWallet: () => void;
}

const FarcasterContext = createContext<FarcasterContextType>({
  isInMiniApp: false,
  isSDKLoaded: false,
  connectFarcasterWallet: () => {},
});

export const useFarcaster = () => useContext(FarcasterContext);

/**
 * Inner component that has access to wagmi hooks
 * Handles auto-connection when in Farcaster Mini App context
 */
function FarcasterAutoConnect({
  children,
  isInMiniApp,
  isSDKLoaded,
}: {
  children: ReactNode;
  isInMiniApp: boolean;
  isSDKLoaded: boolean;
}) {
  const { mutate: connectWallet } = useConnect();
  const connectors = useConnectors();
  const { isConnected } = useAppKitAccount();
  const hasAttemptedAutoConnect = useRef(false);

  // Find the Farcaster connector from wagmi's registered connectors
  const getFarcasterConnector = useCallback(() => {
    return connectors.find((c) => c.id === "farcaster");
  }, [connectors]);

  // Auto-connect to Farcaster wallet when in Mini App context
  useEffect(() => {
    if (
      isInMiniApp &&
      isSDKLoaded &&
      !isConnected &&
      !hasAttemptedAutoConnect.current
    ) {
      const connector = getFarcasterConnector();
      if (connector) {
        hasAttemptedAutoConnect.current = true;
        connectWallet({ connector });
      }
    }
  }, [
    isInMiniApp,
    isSDKLoaded,
    isConnected,
    connectWallet,
    getFarcasterConnector,
  ]);

  // Function to manually connect to Farcaster wallet
  const connectFarcasterWallet = useCallback(() => {
    if (!isConnected) {
      const connector = getFarcasterConnector();
      if (connector) {
        connectWallet({ connector });
      }
    }
  }, [isConnected, connectWallet, getFarcasterConnector]);

  return (
    <FarcasterContext.Provider
      value={{ isInMiniApp, isSDKLoaded, connectFarcasterWallet }}
    >
      {children}
    </FarcasterContext.Provider>
  );
}

/**
 * Component that handles Farcaster Mini App initialization
 * and auto-connects the embedded wallet when in Mini App context
 */
function FarcasterMiniAppHandler({ children }: { children: ReactNode }) {
  const [farcasterState, setFarcasterState] = useState({
    isInMiniApp: false,
    isSDKLoaded: false,
  });
  const hasAttemptedAddMiniApp = useRef(false);

  const handleAddMiniApp = useCallback(async () => {
    try {
      await sdk.actions.addMiniApp();
    } catch (err) {
      console.error("Error adding mini app:", err);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const initFarcaster = async () => {
      try {
        // Get the Farcaster context to check if we're in a Mini App
        const context = await sdk.context;
        const isInMiniApp = !!context;

        if (mounted) {
          setFarcasterState({
            isInMiniApp,
            isSDKLoaded: true,
          });

          // Call ready() to hide the splash screen
          // Safe to call even outside Mini App context
          await sdk.actions.ready();

          // Prompt user to add mini app if in Farcaster context but not yet added
          if (
            isInMiniApp &&
            context &&
            !context.client.added &&
            !hasAttemptedAddMiniApp.current
          ) {
            hasAttemptedAddMiniApp.current = true;
            await handleAddMiniApp();
          }
        }
      } catch {
        if (mounted) {
          setFarcasterState({
            isInMiniApp: false,
            isSDKLoaded: true,
          });
        }
      }
    };

    initFarcaster();

    return () => {
      mounted = false;
    };
  }, [handleAddMiniApp]);

  return (
    <FarcasterAutoConnect
      isInMiniApp={farcasterState.isInMiniApp}
      isSDKLoaded={farcasterState.isSDKLoaded}
    >
      {children}
    </FarcasterAutoConnect>
  );
}

function ContextProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig as Config}>
      <QueryClientProvider client={queryClient}>
        <FarcasterMiniAppHandler>
          <ThemeProvider>
            <EventProvider>{children}</EventProvider>
          </ThemeProvider>
        </FarcasterMiniAppHandler>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export default ContextProvider;
