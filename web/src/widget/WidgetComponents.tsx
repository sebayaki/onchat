/* eslint-disable react-refresh/only-export-components */
import { StrictMode, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider, type Config } from "wagmi";

import ChatClient from "../components/ChatClient";
import { EventProvider } from "../context/EventContext";
import { ThemeProvider } from "./ThemeContext";

export interface OnChatWidgetOptions {
  /** Channel slug to open (e.g., 'vibecoding') */
  channel?: string;
  /** Theme preset ID (e.g., 'classic-blue', 'matrix-green') */
  theme?: string;
  /** Hide the mobile tab navigation */
  hideMobileTabs?: boolean;
  /** Hide the OnChat brand/logo */
  hideBrand?: boolean;
  /** Custom height (default: '100%') */
  height?: string;
  /** Custom color overrides (CSS variable names without --) */
  colors?: Record<string, string>;
}

function WidgetProvider({
  children,
  config,
}: {
  children: React.ReactNode;
  config: Config;
}) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <EventProvider>{children}</EventProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

function OnChatWidget({
  options,
  config,
}: {
  options: OnChatWidgetOptions;
  config: Config;
}) {
  return (
    <WidgetProvider config={config}>
      <div
        className="onchat-widget-root"
        style={{
          width: "100%",
          height: options.height || "100%",
          minHeight: "400px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <ChatClient channelSlug={options.channel} />
      </div>
    </WidgetProvider>
  );
}

export function renderWidget(
  mountPoint: HTMLElement,
  options: OnChatWidgetOptions,
  config: Config
): Root {
  const root = createRoot(mountPoint);
  root.render(
    <StrictMode>
      <OnChatWidget options={options} config={config} />
    </StrictMode>
  );
  return root;
}
