import type { Metadata, Viewport } from "next";
import { JetBrains_Mono } from "next/font/google";
import ContextProvider from "@/context";
import "./globals.css";

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

const APP_URL = "https://onchat.sebayaki.com";

const fcMiniappConfig = JSON.stringify({
  version: "next",
  imageUrl: `${APP_URL}/og-image.jpg`,
  button: {
    title: "OnChat",
    action: {
      type: "launch_frame",
      name: "OnChat",
      url: APP_URL,
      splashImageUrl: `${APP_URL}/app-icon-200x200.png`,
      splashBackgroundColor: "#000000",
    },
  },
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: "OnChat",
  description:
    "A fully permissionless, on-chain chat protocol built on the Base.",
  keywords: ["chat", "onchain", "base", "social", "farcaster"],
  openGraph: {
    title: "OnChat",
    description:
      "A fully permissionless, on-chain chat protocol built on the Base.",
    type: "website",
    images: ["/og-image.jpg"],
  },
  twitter: {
    card: "summary_large_image",
    title: "OnChat",
    description:
      "A fully permissionless, on-chain chat protocol built on the Base.",
    images: ["/og-image.jpg"],
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
  other: {
    "fc:frame": fcMiniappConfig,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={jetbrainsMono.variable}>
      <head>
        {/* Preconnect to Farcaster Quick Auth for optimized performance */}
        <link rel="preconnect" href="https://auth.farcaster.xyz" />
      </head>
      <body>
        <ContextProvider cookies={null}>{children}</ContextProvider>
      </body>
    </html>
  );
}
