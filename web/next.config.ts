import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Only use static export in production - allows faster dev with dynamic routes
  output: process.env.NODE_ENV === "production" ? "export" : undefined,
  images: {
    unoptimized: true,
  },
  reactCompiler: true,
  turbopack: {
    resolveAlias: {
      // Handle optional wallet SDK dependencies that wagmi connectors try to import
      "@gemini-wallet/core": "./src/empty-module.js",
      porto: "./src/empty-module.js",
      "@passkeys/core": "./src/empty-module.js",
      "@turnkey/sdk-browser": "./src/empty-module.js",
      "@turnkey/viem": "./src/empty-module.js",
    },
  },
};

export default nextConfig;
