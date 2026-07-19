import { defineConfig, loadEnv, type UserConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";
import tailwindcss from "@tailwindcss/vite";

// Shared aliases for optional wallet SDK dependencies
const optionalDepsAliases = [
  // Handle optional wallet SDK dependencies (regex to catch subpath imports)
  {
    find: /^@gemini-wallet\/core(\/.*)?$/,
    replacement: resolve(__dirname, "./src/empty-module.js"),
  },
  {
    find: /^porto(\/.*)?$/,
    replacement: resolve(__dirname, "./src/empty-module.js"),
  },
  {
    find: /^@passkeys\/core(\/.*)?$/,
    replacement: resolve(__dirname, "./src/empty-module.js"),
  },
  {
    find: /^@turnkey\/sdk-browser(\/.*)?$/,
    replacement: resolve(__dirname, "./src/empty-module.js"),
  },
  {
    find: /^@turnkey\/viem(\/.*)?$/,
    replacement: resolve(__dirname, "./src/empty-module.js"),
  },
];

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const isWidgetBuild = env.BUILD_TARGET === "widget";

  // Shared config
  const sharedConfig: UserConfig = {
    plugins: [react(), tailwindcss()],
    define: {
      // Required for wagmi/viem
      "process.env": {},
      global: "globalThis",
    },
    envPrefix: "VITE_",
  };

  // Widget build configuration
  if (isWidgetBuild) {
    return {
      ...sharedConfig,
      resolve: {
        alias: [
          // Widget uses its own ThemeContext (no URL sync)
          // MUST come before the general "@" alias
          {
            find: "@/context/ThemeContext",
            replacement: resolve(__dirname, "./src/widget/ThemeContext.tsx"),
          },
          { find: "@", replacement: resolve(__dirname, "./src") },
          ...optionalDepsAliases,
        ],
      },
      build: {
        lib: {
          entry: resolve(__dirname, "src/widget/index.tsx"),
          name: "OnChat",
          fileName: () => "widget.js",
          formats: ["iife"],
        },
        outDir: "public", // Output directly to public folder
        emptyOutDir: false, // Don't clear public folder
        minify: "terser",
        terserOptions: {
          compress: {
            drop_console: true,
            drop_debugger: true,
          },
        },
        rollupOptions: {
          output: {
            inlineDynamicImports: true,
            name: "OnChat",
            exports: "named",
            banner: `/**
 * OnChat Embeddable Widget
 * https://onchat.sebayaki.com
 *
 * Usage:
 *   <div id="onchat"></div>
 *   <script src="https://onchat.sebayaki.com/widget.js"></script>
 *   <script>
 *     OnChat.mount('#onchat', {
 *       channel: 'vibecoding',
 *       theme: 'classic-blue'
 *     });
 *   </script>
 */`,
          },
        },
        target: "es2020",
        chunkSizeWarningLimit: 2000,
      },
    };
  }

  // Main app build configuration
  return {
    ...sharedConfig,
    resolve: {
      alias: [
        { find: "@", replacement: resolve(__dirname, "./src") },
        ...optionalDepsAliases,
      ],
    },
    build: {
      outDir: "dist",
      emptyOutDir: true,
      target: "es2020",
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes("/node_modules/")) return;
            if (/\/node_modules\/(?:react|react-dom|scheduler)\//.test(id)) {
              return "vendor-react";
            }
            if (
              /\/node_modules\/(?:viem|wagmi|@wagmi|@tanstack)\//.test(id)
            ) {
              return "vendor-wagmi";
            }
          },
        },
      },
    },
    server: {
      port: 3000,
      // Handle SPA routing - serve index.html for all routes
      historyApiFallback: true,
    },
    preview: {
      port: 3000,
    },
  };
});
