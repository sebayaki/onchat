import type { Metadata } from "next";
import { IBM_Plex_Mono } from "next/font/google";
import { headers } from "next/headers";
import ContextProvider from "@/context";
import "./globals.css";

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "OnChat - On-Chain Chat on Base",
  description:
    "Fully permissionless, on-chain chat. Create channels, send messages, all stored on Base.",
  keywords: [
    "chat",
    "blockchain",
    "base",
    "ethereum",
    "web3",
    "decentralized",
    "on-chain",
  ],
  openGraph: {
    title: "OnChat - On-Chain Chat on Base",
    description:
      "Fully permissionless, on-chain chat. Create channels, send messages, all stored on Base.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "OnChat - On-Chain Chat on Base",
    description:
      "Fully permissionless, on-chain chat. Create channels, send messages, all stored on Base.",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headersObj = await headers();
  const cookies = headersObj.get("cookie");

  return (
    <html lang="en" className={ibmPlexMono.variable}>
      <body>
        <ContextProvider cookies={cookies}>{children}</ContextProvider>
      </body>
    </html>
  );
}
