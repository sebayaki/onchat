"use client";

import ChatClient from "@/components/ChatClient";
import { usePathname } from "next/navigation";

export default function NotFound() {
  const pathname = usePathname();
  const channel = pathname?.split("/").filter(Boolean)[0];

  return <ChatClient channelSlug={channel} />;
}
