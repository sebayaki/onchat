import { wagmiAdapter } from "@/configs/wagmi";
import { initializeAppKit } from "@/configs/appkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
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
import { EventProvider } from "./EventContext";
import { ThemeProvider } from "./ThemeContext";
import { sdk } from "@farcaster/miniapp-sdk";

// Initialize AppKit
initializeAppKit();

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
