"use client";

import { Suspense } from "react";
import ChatClient from "@/components/ChatClient";

export default function Home() {
  return (
    <Suspense fallback={null}>
      <ChatClient />
    </Suspense>
  );
}
