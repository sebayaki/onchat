"use client";

import { Suspense } from "react";
import ChatClient from "@/components/ChatClient";
import { useTheme } from "@/context/ThemeContext";

export default function Home() {
  const { pathname } = useTheme();
  const channel = pathname?.split("/").filter(Boolean)[0];

  return (
    <Suspense fallback={null}>
      <ChatClient channelSlug={channel} />
    </Suspense>
  );
}
