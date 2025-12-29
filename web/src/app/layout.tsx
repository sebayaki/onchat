import type { Metadata, Viewport } from "next";
import { JetBrains_Mono } from "next/font/google";
import ContextProvider from "@/context";
import "./globals.css";

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

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
    <html lang="en" className={jetbrainsMono.variable}>
      <body>
        <ContextProvider cookies={null}>{children}</ContextProvider>
      </body>
    </html>
  );
}
