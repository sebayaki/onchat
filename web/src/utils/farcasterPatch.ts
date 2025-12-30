/**
 * Farcaster MiniApp SDK Patch for Nested Iframes
 *
 * The Farcaster MiniApp SDK communicates with the host (Warpcast) via
 * window.parent.postMessage(). In a nested iframe scenario:
 *
 *   Warpcast (window.top)
 *     └── Third-party embed site (window.parent)
 *           └── OnChat iframe (window)
 *
 * The SDK would send messages to the third-party site instead of Warpcast.
 * This patch redirects window.parent to window.top for proper communication.
 *
 * IMPORTANT: This file MUST be imported before @farcaster/miniapp-sdk
 */

if (typeof window !== "undefined") {
  try {
    const isInIframe = window !== window.parent;
    const isNestedIframe = isInIframe && window.parent !== window.top;

    if (isNestedIframe && window.top) {
      // Store original parent reference in case needed
      const originalParent = window.parent;

      // Check if we can access window.top (same-origin policy)
      try {
        // This will throw if cross-origin
        const _test = window.top.location.href;
        void _test;

        // If we got here, window.top is accessible
        Object.defineProperty(window, "parent", {
          get: () => window.top,
          configurable: true,
        });

        console.log(
          "[Farcaster Patch] Nested iframe detected, redirected window.parent to window.top"
        );
      } catch {
        // Cross-origin - try a different approach
        // Proxy postMessage calls to window.top
        if (originalParent && originalParent.postMessage) {
          const originalPostMessage =
            originalParent.postMessage.bind(originalParent);

          // Override parent's postMessage to forward to top
          Object.defineProperty(originalParent, "postMessage", {
            value: function (
              message: unknown,
              targetOrigin: string,
              transfer?: Transferable[]
            ) {
              // Forward to window.top for Farcaster communication
              if (window.top) {
                window.top.postMessage(message, targetOrigin, transfer || []);
              }
              // Also send to original parent in case something else needs it
              originalPostMessage(message, targetOrigin, transfer);
            },
            configurable: true,
            writable: true,
          });

          console.log(
            "[Farcaster Patch] Cross-origin nested iframe, proxying postMessage to window.top"
          );
        }
      }
    }
  } catch (e) {
    // Silently fail - we're likely in a restricted context
    console.warn("[Farcaster Patch] Could not apply patch:", e);
  }
}

export {};
