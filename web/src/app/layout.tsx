import type { Metadata } from "next";
import ContextProvider from "@/context";
import "./globals.css";

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
  icons: {
    icon: [
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  manifest: "/site.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:ital,wght@0,100..800;1,100..800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <ContextProvider cookies={null}>{children}</ContextProvider>
      </body>
    </html>
  );
}
