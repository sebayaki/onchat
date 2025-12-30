"use client";

import { wagmiAdapter, projectId, farcasterConnector } from "@/configs/wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createAppKit } from "@reown/appkit/react";
import { base } from "@reown/appkit/networks";
import {
  type ReactNode,
  useState,
  useEffect,
  createContext,
  useContext,
} from "react";
import {
  cookieToInitialState,
  WagmiProvider,
  type Config,
  useConnect,
  useAccount,
} from "wagmi";
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
}

const FarcasterContext = createContext<FarcasterContextType>({
  isInMiniApp: false,
  isSDKLoaded: false,
});

export const useFarcaster = () => useContext(FarcasterContext);

/**
 * Component that handles Farcaster Mini App initialization
 * and auto-connects the embedded wallet when in Mini App context
 */
function FarcasterMiniAppHandler({ children }: { children: ReactNode }) {
  const [farcasterState, setFarcasterState] = useState<FarcasterContextType>({
    isInMiniApp: false,
    isSDKLoaded: false,
  });
  const { connect } = useConnect();
  const { isConnected } = useAccount();

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

          // Auto-connect Farcaster wallet if in Mini App and not already connected
          if (isInMiniApp && !isConnected) {
            try {
              connect({ connector: farcasterConnector });
            } catch (err) {
              console.error("Failed to auto-connect Farcaster wallet:", err);
            }
          }

          // Call ready() to hide the splash screen
          // Safe to call even outside Mini App context
          await sdk.actions.ready();
        }
      } catch (error) {
        console.error("Failed to initialize Farcaster SDK:", error);
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
  }, [connect, isConnected]);

  return (
    <FarcasterContext.Provider value={farcasterState}>
      {children}
    </FarcasterContext.Provider>
  );
}

function ContextProvider({
  children,
  cookies,
}: {
  children: ReactNode;
  cookies: string | null;
}) {
  const [queryClient] = useState(() => new QueryClient());

  const initialState = cookieToInitialState(
    wagmiAdapter.wagmiConfig as Config,
    cookies
  );

  return (
    <WagmiProvider
      config={wagmiAdapter.wagmiConfig as Config}
      initialState={initialState}
    >
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
