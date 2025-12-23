"use client";

import { Suspense } from "react";
import ChatClient from "@/components/ChatClient";
import { usePathname } from "next/navigation";

export default function Home() {
  const pathname = usePathname();
  const channel = pathname?.split("/").filter(Boolean)[0];

  return (
    <Suspense fallback={null}>
      <ChatClient channelSlug={channel} />
    </Suspense>
  );
}
