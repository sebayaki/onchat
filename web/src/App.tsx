import { Suspense, useState, useEffect } from "react";
import ChatClient from "./components/ChatClient";

function getChannelFromPath() {
  if (typeof window === "undefined") return undefined;
  // Get the first segment of the path (e.g., "onchat" from "/onchat")
  return window.location.pathname.split("/").filter(Boolean)[0];
}

/**
 * Main App component that handles client-side routing based on URL path.
 * Reads the channel slug from the URL and passes it to ChatClient.
 */
export default function App() {
  const [channel, setChannel] = useState<string | undefined>(undefined);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Defer state updates to the next frame to ensure DOM is ready
    requestAnimationFrame(() => {
      setChannel(getChannelFromPath());
      setMounted(true);
    });
  }, []);

  // Avoid rendering until we've checked the URL
  if (!mounted) return null;

  return (
    <Suspense fallback={null}>
      <ChatClient channelSlug={channel} />
    </Suspense>
  );
}
