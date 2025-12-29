import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Static export only - no server/SSR, pure client-side app
  output: "export",
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
  devIndicators: false,
  // DEVELOPMENT-ONLY REWRITES
  // --------------------------------------------------------------------------------
  // Since we use 'output: export', Next.js normally generates static HTML files.
  // In production, we rely on the hosting provider (e.g. Vercel, Netlify, Nginx)
  // to handle 404 fallbacks for client-side routing of dynamic paths (e.g. /channel-name).
  //
  // However, in development mode ('next dev'), Next.js tries to compile a full 404
  // page for every unknown path. For apps with heavy client-side logic and complex
  // dependency trees, this 404 compilation can be extremely slow, trigger deadlocks,
  // or cause the dev server to hang indefinitely.
  //
  // By rewriting unknown paths to '/' in development, we:
  // 1. Bypass the expensive 404 compilation overhead.
  // 2. Allow our client-side code (ChatClient) to handle the routing via the URL.
  // 3. Keep the dev server responsive and fast.
  //
  // This block is gated by process.env.NODE_ENV to ensure 'next build' doesn't
  // fail, as rewrites are not supported with 'output: export'.
  ...(process.env.NODE_ENV === "development"
    ? {
        async rewrites() {
          return [
            {
              // Rewrite all paths to the root '/' except for Next.js internals and assets.
              // The regex (?!_next|favicon.ico|site.webmanifest) prevents infinite
              // rewrite loops for scripts, styles, and core metadata files.
              source: "/:path((?!_next|favicon.ico|site.webmanifest).+)",
              destination: "/",
            },
          ];
        },
      }
    : {}),
};

export default nextConfig;
