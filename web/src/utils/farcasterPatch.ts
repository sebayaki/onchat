/**
 * Patch for Farcaster Mini App SDK to use window.top instead of window.parent
 *
 * This fixes communication issues when the app is embedded in a nested iframe.
 * The SDK normally uses window.parent, but in nested iframes, we need to communicate
 * with window.top (the Farcaster host) directly.
 *
 * IMPORTANT: This file must be imported BEFORE any @farcaster/miniapp-sdk imports!
 */

if (typeof window !== "undefined") {
  // Check if we're in a nested iframe (parent !== top)
  const isNestedIframe = window.parent !== window.top;

  if (isNestedIframe) {
    console.log(
      "[Farcaster Patch] Detected nested iframe, patching window.parent to use window.top"
    );

    try {
      // Try to access window.top (may fail due to cross-origin restrictions)
      // If accessible, override the parent getter
      const topWindow = window.top;

      if (topWindow) {
        // Create a proxy that redirects parent access to top
        Object.defineProperty(window, "parent", {
          get() {
            return topWindow;
          },
          configurable: true,
        });
        console.log(
          "[Farcaster Patch] Successfully patched window.parent to window.top"
        );
      }
    } catch (e) {
      console.warn(
        "[Farcaster Patch] Cannot access window.top due to cross-origin restrictions:",
        e
      );
    }
  } else {
    console.log("[Farcaster Patch] Not in nested iframe, no patch needed");
  }
}

export {};
