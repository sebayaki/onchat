"use client";

import { useState, useEffect } from "react";
import { type ChannelInfo } from "@/helpers/contracts";
import CopyButton from "./CopyButton";

const THEME_VARS = [
  { name: "--bg-primary", label: "Background Primary" },
  { name: "--bg-secondary", label: "Background Secondary" },
  { name: "--bg-tertiary", label: "Background Tertiary" },
  { name: "--bg-hover", label: "Background Hover" },
  { name: "--text-primary", label: "Text Primary" },
  { name: "--text-muted", label: "Text Muted" },
  { name: "--text-dim", label: "Text Dim" },
  { name: "--color-system", label: "System Color" },
  { name: "--color-error", label: "Error Color" },
  { name: "--color-info", label: "Info Color" },
  { name: "--color-action", label: "Action Color" },
  { name: "--color-nick", label: "Nick Color" },
  { name: "--color-channel", label: "Channel Color" },
  { name: "--color-timestamp", label: "Timestamp Color" },
  { name: "--color-content", label: "Content Color" },
];

export function ShareModal({
  showShareModal,
  setShowShareModal,
  currentChannel,
}: {
  showShareModal: boolean;
  setShowShareModal: (show: boolean) => void;
  currentChannel: ChannelInfo | null;
}) {
  const [theme, setTheme] = useState<Record<string, string>>({});
  const [controls, setControls] = useState({
    "hide-mobile-tabs": false,
    "hide-brand": false,
  });

  useEffect(() => {
    if (showShareModal) {
      // Get initial values from computed styles
      const initialTheme: Record<string, string> = {};
      const rootStyle = getComputedStyle(document.documentElement);
      THEME_VARS.forEach((v) => {
        initialTheme[v.name] = rootStyle.getPropertyValue(v.name).trim();
      });
      // Defer to avoid synchronous setState warning
      const timeoutId = setTimeout(() => {
        setTheme(initialTheme);
      }, 0);
      return () => clearTimeout(timeoutId);
    }
  }, [showShareModal]);

  if (!showShareModal) return null;

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  const channelSlug = currentChannel?.slug || "";
  const shareUrl = new URL(`${baseUrl}/${channelSlug}`);

  // Add theme params
  Object.entries(theme).forEach(([key, value]) => {
    const rootValue = getComputedStyle(document.documentElement)
      .getPropertyValue(key)
      .trim();
    if (value && value !== rootValue) {
      shareUrl.searchParams.set(key.replace("--", ""), value);
    }
  });

  // Add control params
  Object.entries(controls).forEach(([key, value]) => {
    if (value) {
      shareUrl.searchParams.set(key, "true");
    }
  });

  const fullShareUrl = shareUrl.toString();
  const iframeCode = `<iframe src="${fullShareUrl}" width="100%" height="600" frameborder="0"></iframe>`;

  return (
    <div
      className="fixed inset-0 bg-black/85 flex items-center justify-center z-[10000] animate-[fadeIn_0.15s_ease-out]"
      onClick={() => setShowShareModal(false)}
    >
      <div
        className="bg-[var(--bg-secondary)] border border-[var(--text-muted)] w-[95%] max-w-[600px] max-h-[90vh] flex flex-col animate-[modalSlideIn_0.2s_ease-out]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center px-4 py-3 border-b border-[var(--bg-tertiary)]">
          <h2 className="m-0 text-[0.9rem] text-[var(--text-primary)] uppercase tracking-[1px] font-mono font-bold">
            Share Channel
          </h2>
          <button
            className="bg-transparent border-none text-[var(--text-muted)] text-2xl cursor-pointer leading-none p-0 hover:text-[var(--color-error)]"
            onClick={() => setShowShareModal(false)}
          >
            ×
          </button>
        </div>

        <div className="p-4 overflow-y-auto flex-1 font-mono space-y-6">
          {/* Theme Settings */}
          <section>
            <h3 className="text-[0.75rem] text-[var(--text-muted)] uppercase mb-3 tracking-[1px]">
              Theme Colors
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {THEME_VARS.map((v) => (
                <div
                  key={v.name}
                  className="flex items-center justify-between gap-2"
                >
                  <label className="text-[0.7rem] text-[var(--text-dim)] truncate">
                    {v.label}
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={theme[v.name] || ""}
                      onChange={(e) =>
                        setTheme((prev) => ({
                          ...prev,
                          [v.name]: e.target.value,
                        }))
                      }
                      className="bg-[var(--bg-tertiary)] border border-[var(--text-muted)] text-[var(--text-primary)] text-[0.7rem] px-2 py-1 w-[100px] font-mono"
                    />
                    <input
                      type="color"
                      value={
                        theme[v.name]?.startsWith("#")
                          ? theme[v.name]
                          : "#000000"
                      }
                      onChange={(e) =>
                        setTheme((prev) => ({
                          ...prev,
                          [v.name]: e.target.value,
                        }))
                      }
                      className="w-6 h-6 p-0 border-none bg-transparent cursor-pointer"
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Control Options */}
          <section>
            <h3 className="text-[0.75rem] text-[var(--text-muted)] uppercase mb-3 tracking-[1px]">
              Control Options
            </h3>
            <div className="flex flex-wrap gap-4">
              {Object.entries(controls).map(([key, value]) => (
                <label
                  key={key}
                  className="flex items-center gap-2 cursor-pointer group"
                >
                  <input
                    type="checkbox"
                    checked={value}
                    onChange={(e) =>
                      setControls((prev) => ({
                        ...prev,
                        [key]: e.target.checked,
                      }))
                    }
                    className="hidden"
                  />
                  <div
                    className={`w-4 h-4 border flex items-center justify-center transition-colors ${
                      value
                        ? "bg-[var(--text-primary)] border-[var(--text-primary)]"
                        : "border-[var(--text-muted)] group-hover:border-[var(--text-primary)]"
                    }`}
                  >
                    {value && (
                      <span className="text-[var(--bg-primary)] text-[10px]">
                        ✓
                      </span>
                    )}
                  </div>
                  <span className="text-[0.75rem] text-[var(--text-primary)]">
                    {key.replace(/-/g, " ")}
                  </span>
                </label>
              ))}
            </div>
          </section>

          {/* Preview/Output */}
          <section className="space-y-4">
            <h3 className="text-[0.75rem] text-[var(--text-muted)] uppercase mb-3 tracking-[1px]">
              Share Links
            </h3>

            <div className="space-y-2">
              <label className="text-[0.7rem] text-[var(--text-dim)]">
                Direct URL
              </label>
              <div className="flex gap-2">
                <input
                  readOnly
                  value={fullShareUrl}
                  className="flex-1 bg-[var(--bg-tertiary)] border border-[var(--text-muted)] text-[var(--text-primary)] text-[0.7rem] px-3 py-2 font-mono"
                />
                <CopyButton
                  textToCopy={fullShareUrl}
                  className="bg-[var(--bg-tertiary)] border border-[var(--text-muted)] p-2 hover:bg-[var(--bg-hover)] transition-colors"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[0.7rem] text-[var(--text-dim)]">
                Iframe Snippet
              </label>
              <div className="flex gap-2">
                <textarea
                  readOnly
                  value={iframeCode}
                  className="flex-1 bg-[var(--bg-tertiary)] border border-[var(--text-muted)] text-[var(--text-primary)] text-[0.7rem] px-3 py-2 font-mono h-20 resize-none"
                />
                <CopyButton
                  textToCopy={iframeCode}
                  className="bg-[var(--bg-tertiary)] border border-[var(--text-muted)] p-2 hover:bg-[var(--bg-hover)] transition-colors"
                />
              </div>
            </div>
          </section>

          {/* Iframe Preview */}
          <section>
            <h3 className="text-[0.75rem] text-[var(--text-muted)] uppercase mb-3 tracking-[1px]">
              Live Preview
            </h3>
            <div className="border border-[var(--text-muted)] h-[200px] overflow-hidden">
              <iframe
                src={fullShareUrl}
                width="100%"
                height="100%"
                frameBorder="0"
                className="pointer-events-none"
              />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
