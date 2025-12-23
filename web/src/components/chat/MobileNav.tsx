"use client";

export function MobileNav({
  activeTab,
  setActiveTab,
  isConnected,
  openWalletModal,
}: {
  activeTab: "chat" | "channels" | "rewards";
  setActiveTab: (tab: "chat" | "channels" | "rewards") => void;
  isConnected: boolean;
  openWalletModal: () => void;
}) {
  return (
    <nav className="sm:hidden flex items-center justify-around bg-[var(--bg-secondary)] border-t border-[var(--bg-tertiary)] py-2 px-1 pb-[calc(0.5rem+env(safe-area-inset-bottom))]">
      <button
        onClick={() => setActiveTab("channels")}
        className={`flex flex-col items-center gap-1 bg-transparent border-none cursor-pointer ${
          activeTab === "channels"
            ? "text-[var(--color-channel)]"
            : "text-[var(--text-dim)]"
        }`}
      >
        <span className="text-[1.2rem]">#</span>
        <span className="text-[0.65rem] uppercase font-bold tracking-[1px]">
          Channels
        </span>
      </button>
      <button
        onClick={() => setActiveTab("chat")}
        className={`flex flex-col items-center gap-1 bg-transparent border-none cursor-pointer ${
          activeTab === "chat"
            ? "text-[var(--color-accent)]"
            : "text-[var(--text-dim)]"
        }`}
      >
        <span className="text-[1.2rem]">💬</span>
        <span className="text-[0.65rem] uppercase font-bold tracking-[1px]">
          Chat
        </span>
      </button>
      <button
        onClick={() => setActiveTab("rewards")}
        className={`flex flex-col items-center gap-1 bg-transparent border-none cursor-pointer ${
          activeTab === "rewards"
            ? "text-[var(--color-action)]"
            : "text-[var(--text-dim)]"
        }`}
      >
        <span className="text-[1.2rem]">💎</span>
        <span className="text-[0.65rem] uppercase font-bold tracking-[1px]">
          Rewards
        </span>
      </button>
      <button
        onClick={openWalletModal}
        className={`flex flex-col items-center gap-1 bg-transparent border-none cursor-pointer ${
          isConnected
            ? "text-[var(--color-accent)]"
            : "text-[var(--text-primary)]"
        }`}
      >
        <div
          className={`w-3 h-3 rounded-full bg-current ${
            isConnected ? "animate-pulse" : "opacity-50"
          } mb-1`}
        />
        <span className="text-[0.65rem] uppercase font-bold tracking-[1px]">
          {isConnected ? "Wallet" : "Connect"}
        </span>
      </button>
    </nav>
  );
}
