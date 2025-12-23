"use client";

import { formatNumber } from "@/helpers/format";

export function RewardsView({
  ownerBalance,
  claimingBalance,
  handleClaim,
}: {
  ownerBalance: bigint;
  claimingBalance: boolean;
  handleClaim: () => Promise<void>;
}) {
  return (
    <div className="flex-1 overflow-y-auto px-6 py-8 bg-[var(--bg-primary)] font-mono">
      <h2 className="text-[var(--color-accent)] uppercase tracking-[2px] mb-6 border-b border-[var(--bg-tertiary)] pb-2">
        Creator Rewards
      </h2>
      <div className="bg-[var(--bg-secondary)] border border-[var(--color-accent-dim)] p-6 rounded-lg mb-8">
        <p className="text-[var(--text-dim)] text-[0.85rem] mb-2 uppercase tracking-[1px]">
          Claimable Balance
        </p>
        <div className="text-3xl font-bold text-[var(--color-accent)] mb-6">
          {formatNumber(ownerBalance, { fromDecimals: 18 })} ETH
        </div>
        <button
          className="w-full bg-[var(--color-accent)] text-[var(--bg-primary)] border-none py-3 text-lg font-bold cursor-pointer transition-all hover:bg-[var(--text-primary)] disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={handleClaim}
          disabled={claimingBalance || ownerBalance === BigInt(0)}
        >
          {claimingBalance ? "Claiming..." : "Claim Rewards"}
        </button>
        {ownerBalance === BigInt(0) && (
          <p className="text-[var(--text-dim)] text-[0.75rem] mt-3 italic text-center">
            No rewards to claim yet. Create channels to earn.
          </p>
        )}
      </div>
      <div className="text-[var(--text-muted)] text-[0.8rem] space-y-4">
        <p>
          <span className="text-[var(--color-action)]">ℹ</span> Rewards are
          earned when other users join the channels you created.
        </p>
        <p>
          <span className="text-[var(--color-action)]">ℹ</span> All transactions
          happen on the Base Network.
        </p>
      </div>
    </div>
  );
}
