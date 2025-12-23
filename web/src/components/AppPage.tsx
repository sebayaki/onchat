"use client";

import { Suspense, useState, useEffect } from "react";
import ChatClient from "@/components/ChatClient";

function getChannelFromPath() {
  if (typeof window === "undefined") return undefined;
  // Get the first segment of the path (e.g., "onchat" from "/onchat")
  return window.location.pathname.split("/").filter(Boolean)[0];
}

/**
 * Shared page component used by both the root page and the 404 handler.
 * It handles client-side detection of the channel slug from the URL path,
 * which is necessary for 'output: export' builds to support dynamic routes.
 */
export default function AppPage() {
  const [channel, setChannel] = useState<string | undefined>(undefined);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Defer state updates to the next frame to avoid cascading render warnings
    // from the React Compiler and ensure hydration consistency.
    requestAnimationFrame(() => {
      setChannel(getChannelFromPath());
      setMounted(true);
    });
  }, []);

  // Avoid rendering until we've had a chance to check the URL on the client.
  // This prevents hydration mismatches and ensures ChatClient receives the correct slug.
  if (!mounted) return null;

  return (
    <Suspense fallback={null}>
      <ChatClient channelSlug={channel} />
    </Suspense>
  );
}
