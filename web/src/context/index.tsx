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
import { WagmiProvider, type Config } from "wagmi";
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
        // Use sdk.isInMiniApp() with timeout to prevent hanging in regular iframes
        // The SDK has a built-in timeout (default 1000ms), we use 2000ms for reliability
        // Cast to bypass type definition that may not include the timeout parameter
        const inMiniApp = await (
          sdk.isInMiniApp as (timeoutMs?: number) => Promise<boolean>
        )(2000);

        if (!inMiniApp) {
          if (mounted) {
            setFarcasterState({
              isInMiniApp: false,
              isSDKLoaded: true,
            });
          }
          return;
        }

        // Now safe to get context since we confirmed we're in a Mini App
        const context = await sdk.context;

        if (mounted) {
          setFarcasterState({
            isInMiniApp: true,
            isSDKLoaded: true,
          });

          // Call ready() to hide the splash screen
          await sdk.actions.ready();

          // Prompt user to add mini app if in Farcaster context but not yet added
          if (
            context &&
            !context.client.added &&
            !hasAttemptedAddMiniApp.current
          ) {
            hasAttemptedAddMiniApp.current = true;
            await handleAddMiniApp();
          }
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
  }, [handleAddMiniApp]);

  return (
    <FarcasterContext.Provider value={farcasterState}>
      {children}
    </FarcasterContext.Provider>
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
