import { FormEvent, useEffect, useState } from "react";
import { getChannelCreationFee, getWalletBalance } from "@/helpers/contracts";
import { formatEther } from "viem";

export function CreateChannelModal({
  showCreateChannel,
  setShowCreateChannel,
  isConnected,
  address,
  handleCreateChannel,
  newChannelName,
  setNewChannelName,
  isLoading,
}: {
  showCreateChannel: boolean;
  setShowCreateChannel: (show: boolean) => void;
  isConnected: boolean;
  address?: string;
  handleCreateChannel: (e: FormEvent) => void;
  newChannelName: string;
  setNewChannelName: (val: string) => void;
  isLoading: boolean;
}) {
  const [creationFee, setCreationFee] = useState<bigint | null>(null);
  const [walletBalance, setWalletBalance] = useState<bigint | null>(null);

  useEffect(() => {
    if (!showCreateChannel) {
      return;
    }

    let cancelled = false;

    async function loadFeeAndBalance() {
      try {
        const fee = await getChannelCreationFee();
        if (cancelled) return;
        setCreationFee(fee);

        if (address) {
          const balance = await getWalletBalance(address as `0x${string}`);
          if (cancelled) return;
          setWalletBalance(balance);
        }
      } catch (err) {
        console.error("Failed to load channel creation fee:", err);
      }
    }

    loadFeeAndBalance();

    return () => {
      cancelled = true;
    };
  }, [showCreateChannel, address]);

  const hasInsufficientBalance =
    creationFee !== null &&
    walletBalance !== null &&
    walletBalance < creationFee;

  if (!showCreateChannel) return null;

  return (
    <div
      className="fixed inset-0 bg-black/85 flex items-center justify-center z-[10000] animate-[fadeIn_0.15s_ease-out]"
      onClick={() => setShowCreateChannel(false)}
    >
      <div
        className="bg-[var(--bg-secondary)] border border-[var(--primary-muted)] w-[90%] max-w-[400px] max-h-[80vh] flex flex-col animate-[modalSlideIn_0.2s_ease-out]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center px-4 py-3 border-b border-[var(--bg-tertiary)]">
          <h2 className="m-0 text-[0.9rem] text-[var(--primary)] uppercase tracking-[1px] font-mono font-bold">
            Create Channel
          </h2>
          <button
            className="bg-transparent border-none text-[var(--primary-muted)] text-2xl cursor-pointer leading-none p-0 hover:text-[var(--color-error)]"
            onClick={() => setShowCreateChannel(false)}
          >
            ×
          </button>
        </div>
        <div className="p-4 overflow-y-auto flex-1 font-mono">
          {!isConnected ? (
            <div className="text-[var(--primary-muted)] text-center py-8 text-[0.85rem]">
              Connect your wallet to create a channel
            </div>
          ) : (
            <form
              onSubmit={handleCreateChannel}
              className="flex flex-col gap-3"
            >
              <label
                htmlFor="channel-name"
                className="text-[0.75rem] text-[var(--primary-muted)] uppercase tracking-[1px]"
              >
                Channel Name
              </label>
              <div className="flex items-center bg-[var(--bg-primary)] border border-[var(--bg-tertiary)]">
                <span className="text-[var(--color-channel)] px-2 text-base">
                  #
                </span>
                <input
                  id="channel-name"
                  type="text"
                  value={newChannelName}
                  onChange={(e) =>
                    setNewChannelName(
                      e.target.value.toLowerCase().replace(/[^a-z-]/g, "")
                    )
                  }
                  placeholder="my-channel"
                  maxLength={20}
                  autoFocus
                  className="flex-1 bg-transparent border-none text-[var(--color-channel)] font-mono text-[0.9rem] py-2 outline-none placeholder:text-[var(--text-dim)]"
                />
              </div>
              <p className="text-[0.7rem] text-[var(--text-dim)] m-0">
                Lowercase letters and hyphens only, max 20 chars
              </p>
              <button
                type="submit"
                className="bg-[var(--primary)] border-none text-[var(--bg-primary)] py-2 px-4 font-mono text-[0.85rem] font-bold cursor-pointer transition-all hover:not-disabled:bg-[var(--primary)] disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                disabled={
                  !newChannelName.trim() || isLoading || hasInsufficientBalance
                }
              >
                {isLoading ? "Creating..." : "Create Channel"}
              </button>
              {hasInsufficientBalance && (
                <p className="text-[0.75rem] text-[var(--color-error)] text-center m-0">
                  Insufficient balance ({formatEther(walletBalance!)} ETH)
                </p>
              )}
              <p className="text-[0.7rem] text-[var(--text-dim)] text-center m-0">
                {creationFee !== null
                  ? `Creation Fee: ${formatEther(creationFee)} ETH`
                  : "Loading creation fee..."}
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
