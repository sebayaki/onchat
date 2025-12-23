"use client";

import { wagmiAdapter, projectId } from "@/configs/wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createAppKit } from "@reown/appkit/react";
import { base } from "@reown/appkit/networks";
import { type ReactNode, useState } from "react";
import { cookieToInitialState, WagmiProvider, type Config } from "wagmi";
import { APP_URL, APP_NAME, APP_DESCRIPTION } from "@/configs/constants";
import { EventProvider } from "./EventContext";

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
        <EventProvider>{children}</EventProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export default ContextProvider;
