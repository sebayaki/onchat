"use client";

import { Suspense } from "react";
import { useState } from "react";
import ChatClient from "@/components/ChatClient";

function getChannelFromPath() {
  if (typeof window === "undefined") return undefined;
  return window.location.pathname.split("/").filter(Boolean)[0];
}

export default function NotFound() {
  const [channel] = useState(getChannelFromPath);

  return (
    <Suspense fallback={null}>
      <ChatClient channelSlug={channel} />
    </Suspense>
  );
}
