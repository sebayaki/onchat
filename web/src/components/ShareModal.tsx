"use client";

import { useState, useEffect } from "react";
import { type ChannelInfo } from "@/helpers/contracts";
import CopyButton from "./CopyButton";
import { themes } from "@/helpers/themes";
import { ChevronDownIcon } from "./Icons";
import { THEME_VARS, CONTROL_VARS } from "@/context/ThemeContext";

function rgbToHex(rgb: string) {
  if (!rgb) return "#000000";
  if (rgb.startsWith("#")) {
    if (rgb.length === 4) {
      return (
        "#" +
        rgb[1] +
        rgb[1] +
        rgb[2] +
        rgb[2] +
        rgb[3] +
        rgb[3]
      ).toLowerCase();
    }
    return rgb.toLowerCase();
  }
  const match = rgb.match(
    /^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d+(?:\.\d+)?))?\)$/
  );
  if (!match) return "#000000";
  const r = parseInt(match[1]);
  const g = parseInt(match[2]);
  const b = parseInt(match[3]);
  return (
    "#" +
    [r, g, b]
      .map((x) => {
        const hex = x.toString(16);
        return hex.length === 1 ? "0" + hex : hex;
      })
      .join("")
  ).toLowerCase();
}

export function ShareModal({
  showShareModal,
  setShowShareModal,
  currentChannel,
}: {
  showShareModal: boolean;
  setShowShareModal: (show: boolean) => void;
  currentChannel: ChannelInfo | null;
}) {
  const [selectedThemeId, setSelectedThemeId] =
    useState<string>("classic-blue");
  const [theme, setTheme] = useState<Record<string, string>>({});
  const [controls, setControls] = useState({
    [CONTROL_VARS.HIDE_MOBILE_TABS]: true,
    [CONTROL_VARS.HIDE_BRAND]: true,
  });
  const [isThemeDropdownOpen, setIsThemeDropdownOpen] = useState(false);

  useEffect(() => {
    if (showShareModal) {
      const params = new URLSearchParams(window.location.search);
      const urlTheme = params.get("theme") || "classic-blue";

      const initialTheme: Record<string, string> = {};
      const rootStyle = getComputedStyle(document.documentElement);
      THEME_VARS.forEach((v) => {
        initialTheme[v.id] = rgbToHex(
          rootStyle.getPropertyValue(`--${v.id}`).trim()
        );
      });

      const timeoutId = setTimeout(() => {
        setSelectedThemeId(urlTheme);
        setTheme(initialTheme);
        setControls({
          [CONTROL_VARS.HIDE_MOBILE_TABS]: true,
          [CONTROL_VARS.HIDE_BRAND]: true,
        });
      }, 0);
      return () => clearTimeout(timeoutId);
    }
  }, [showShareModal]);

  if (!showShareModal) return null;

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  const channelSlug = currentChannel?.slug || "";
  const shareUrl = new URL(`${baseUrl}/${channelSlug}`);

  if (selectedThemeId && selectedThemeId !== "classic-blue") {
    shareUrl.searchParams.set("theme", selectedThemeId);
  }

  Object.entries(theme).forEach(([key, value]) => {
    const selectedTheme = themes.find((t) => t.id === selectedThemeId);
    if (!selectedTheme) return;

    const themeKey = key.replace(/-([a-z])/g, (g) =>
      g[1].toUpperCase()
    ) as keyof typeof selectedTheme.colors;
    const baseColor = rgbToHex(selectedTheme.colors[themeKey] as string);

    if (value && value.toLowerCase() !== baseColor.toLowerCase()) {
      shareUrl.searchParams.set(key, value.replace("#", ""));
    }
  });

  Object.entries(controls).forEach(([key, value]) => {
    if (value) shareUrl.searchParams.set(key, "true");
  });

  const fullShareUrl = shareUrl.toString();
  const iframeCode = `<iframe src="${fullShareUrl}" width="100%" height="600" frameborder="0"></iframe>`;

  return (
    <div
      className="fixed inset-0 bg-black/85 flex items-center justify-center z-[10000] animate-[fadeIn_0.15s_ease-out]"
      onClick={() => setShowShareModal(false)}
    >
      <div
        className="bg-[var(--bg-secondary)] border border-[var(--primary-muted)] w-[95%] max-w-[1000px] h-[90vh] flex flex-col md:flex-row animate-[modalSlideIn_0.2s_ease-out] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex-1 flex flex-col min-w-0 order-2 md:order-1 overflow-hidden">
          <div className="flex justify-between items-center px-4 py-3 border-b border-[var(--bg-tertiary)] shrink-0">
            <h2 className="m-0 text-[0.9rem] text-[var(--primary)] uppercase tracking-[1px] font-mono font-bold">
              Embed Chat In Your App
            </h2>
            <button
              className="bg-transparent border-none text-[var(--primary-muted)] text-2xl cursor-pointer leading-none p-0 hover:text-[var(--color-error)] md:hidden"
              onClick={() => setShowShareModal(false)}
            >
              ×
            </button>
          </div>

          <div className="flex-1 p-4 overflow-y-auto font-mono space-y-6">
            <section>
              <h3 className="text-[0.75rem] text-[var(--primary-muted)] uppercase mb-3 tracking-[1px]">
                Theme Preset
              </h3>
              <div className="relative">
                <button
                  onClick={() => setIsThemeDropdownOpen(!isThemeDropdownOpen)}
                  className="w-full bg-[var(--bg-tertiary)] border border-[var(--primary-muted)] text-[var(--primary)] px-3 py-2 text-[0.8rem] flex justify-between items-center cursor-pointer hover:border-[var(--primary)] transition-colors"
                >
                  <span>
                    {themes.find((t) => t.id === selectedThemeId)?.name ||
                      "Select Theme"}
                  </span>
                  <ChevronDownIcon
                    size={16}
                    className={`transition-transform ${
                      isThemeDropdownOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {isThemeDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-[var(--bg-secondary)] border border-[var(--primary-muted)] z-10 shadow-xl max-h-[300px] overflow-y-auto scrollbar-thin">
                    {themes.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => {
                          setSelectedThemeId(t.id);
                          const newTheme: Record<string, string> = {};
                          THEME_VARS.forEach((v) => {
                            const themeKey = v.id.replace(/-([a-z])/g, (g) =>
                              g[1].toUpperCase()
                            ) as keyof typeof t.colors;
                            newTheme[v.id] = rgbToHex(
                              t.colors[themeKey] as string
                            );
                          });
                          setTheme(newTheme);
                          setIsThemeDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-[0.75rem] transition-colors flex items-center gap-3 cursor-pointer ${
                          selectedThemeId === t.id
                            ? "bg-[var(--bg-tertiary)] text-[var(--primary)]"
                            : "hover:bg-[var(--bg-hover)] text-[var(--primary)]"
                        }`}
                      >
                        <div className="flex gap-1 shrink-0">
                          <div
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: t.colors.bgPrimary }}
                          />
                          <div
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: t.colors.primary }}
                          />
                        </div>
                        <span>{t.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </section>

            <section>
              <h3 className="text-[0.75rem] text-[var(--primary-muted)] uppercase mb-3 tracking-[1px]">
                Theme Colors
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-3">
                {THEME_VARS.map((v) => (
                  <div
                    key={v.id}
                    className="flex items-center justify-between gap-2"
                  >
                    <label className="text-[0.7rem] text-[var(--text-dim)] truncate">
                      {v.label}
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={theme[v.id] || ""}
                        onChange={(e) =>
                          setTheme((prev) => ({
                            ...prev,
                            [v.id]: e.target.value,
                          }))
                        }
                        className="bg-[var(--bg-tertiary)] border border-[var(--primary-muted)] text-[var(--primary)] text-[0.7rem] px-2 py-1 w-[80px] font-mono"
                      />
                      <input
                        type="color"
                        value={rgbToHex(theme[v.id] || "#000000")}
                        onChange={(e) =>
                          setTheme((prev) => ({
                            ...prev,
                            [v.id]: e.target.value,
                          }))
                        }
                        className="w-6 h-6 p-0 border-none bg-transparent cursor-pointer"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h3 className="text-[0.75rem] text-[var(--primary-muted)] uppercase mb-3 tracking-[1px]">
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
                          ? "bg-[var(--primary)] border-[var(--primary)]"
                          : "border-[var(--primary-muted)] group-hover:border-[var(--primary)]"
                      }`}
                    >
                      {value && (
                        <span className="text-[var(--bg-primary)] text-[10px]">
                          ✓
                        </span>
                      )}
                    </div>
                    <span className="text-[0.75rem] text-[var(--primary)]">
                      {key.replace(/-/g, " ")}
                    </span>
                  </label>
                ))}
              </div>
            </section>

            <section className="space-y-4 pt-4 border-t border-[var(--bg-tertiary)]">
              <h3 className="text-[0.75rem] text-[var(--primary-muted)] uppercase mb-3 tracking-[1px]">
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
                    className="flex-1 bg-[var(--bg-tertiary)] border border-[var(--primary-muted)] text-[var(--primary)] text-[0.7rem] px-3 py-2 font-mono"
                  />
                  <CopyButton
                    textToCopy={fullShareUrl}
                    className="bg-[var(--bg-tertiary)] border border-[var(--primary-muted)] p-2 hover:bg-[var(--bg-hover)] transition-colors"
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
                    className="flex-1 bg-[var(--bg-tertiary)] border border-[var(--primary-muted)] text-[var(--primary)] text-[0.7rem] px-3 py-2 font-mono h-20 resize-none"
                  />
                  <CopyButton
                    textToCopy={iframeCode}
                    className="bg-[var(--bg-tertiary)] border border-[var(--primary-muted)] p-2 hover:bg-[var(--bg-hover)] transition-colors"
                  />
                </div>
              </div>
            </section>
          </div>
        </div>

        <div className="w-full md:w-[390px] h-[40vh] md:h-full bg-black order-1 md:order-2 shrink-0 md:border-l border-[var(--primary-muted)]">
          <div className="h-full flex flex-col">
            <div className="px-3 py-2 bg-[var(--bg-tertiary)] border-b border-[var(--primary-muted)] flex justify-between items-center shrink-0">
              <span className="text-[0.65rem] text-[var(--primary-muted)] uppercase tracking-[1px]">
                Live Preview
              </span>
              <div className="flex items-center gap-3">
                <span className="text-[0.65rem] text-[var(--text-dim)]">
                  390px
                </span>
                <button
                  className="bg-transparent border-none text-[var(--primary-muted)] text-xl cursor-pointer leading-none p-0 hover:text-[var(--color-error)] hidden md:block"
                  onClick={() => setShowShareModal(false)}
                >
                  ×
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-hidden">
              <iframe
                key={fullShareUrl}
                src={fullShareUrl}
                width="100%"
                height="100%"
                frameBorder="0"
                className="pointer-events-none"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
