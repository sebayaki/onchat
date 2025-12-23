"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { formatEther } from "viem";
import { formatNumber } from "@/helpers/format";
import { getMessageFeeBase, getMessageFeePerChar } from "@/helpers/contracts";
import InfoIcon from "@/assets/icons/info.svg";

export function RewardsView({
  ownerBalance,
  claimingBalance,
  handleClaim,
}: {
  ownerBalance: bigint;
  claimingBalance: boolean;
  handleClaim: () => Promise<void>;
}) {
  const [fees, setFees] = useState<{ base: bigint; perChar: bigint }>({
    base: BigInt(0),
    perChar: BigInt(0),
  });

  useEffect(() => {
    async function loadFees() {
      try {
        const [base, perChar] = await Promise.all([
          getMessageFeeBase(),
          getMessageFeePerChar(),
        ]);
        setFees({ base, perChar });
      } catch (err) {
        console.error("Failed to load fee info:", err);
      }
    }
    loadFees();
  }, []);

  return (
    <div className="flex-1 overflow-y-auto px-6 py-8 bg-[var(--bg-primary)] font-mono flex flex-col items-center">
      <div className="w-full max-w-2xl">
        <h2 className="text-[var(--text-primary)] uppercase tracking-[2px] mb-6 border-b border-[var(--bg-tertiary)] pb-2">
          Creator Rewards
        </h2>
        <div className="bg-[var(--bg-secondary)] border border-[var(--text-muted)] p-8 rounded-sm mb-8">
          <p className="text-[var(--text-dim)] text-[0.85rem] mb-4 uppercase tracking-[1px]">
            Claimable Balance
          </p>
          <div className="text-4xl font-bold text-[var(--text-primary)] mb-8">
            {formatNumber(ownerBalance, { fromDecimals: 18 })}{" "}
            <span className="text-xl font-normal opacity-70">ETH</span>
          </div>
          <button
            className="w-full bg-[var(--text-primary)] text-[var(--bg-primary)] border-none py-4 text-lg font-bold cursor-pointer transition-all hover:bg-[var(--text-primary)] disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider"
            onClick={handleClaim}
            disabled={claimingBalance || ownerBalance === BigInt(0)}
          >
            {claimingBalance ? "Claiming..." : "Claim Rewards"}
          </button>
          {ownerBalance === BigInt(0) && (
            <p className="text-[var(--text-dim)] text-[0.75rem] mt-4 italic text-center">
              No rewards to claim yet. Create channels to earn.
            </p>
          )}
        </div>
        <div className="text-[var(--text-muted)] text-[0.85rem] bg-[var(--bg-tertiary)]/30 p-5 border-l-2 border-[var(--text-primary)]">
          <div className="flex items-start gap-2 mb-3">
            <Image
              src={InfoIcon}
              alt="Info"
              width={16}
              height={16}
              className="w-4 h-4 mt-0.5 shrink-0"
            />
            <span className="font-bold text-[var(--text-primary)] uppercase tracking-wider">
              How you earn
            </span>
          </div>
          <div className="space-y-4 pl-6">
            <p>
              Rewards are earned from message fees in the channels you created.
            </p>
            <div className="bg-[var(--bg-primary)]/50 p-3 rounded-sm border border-[var(--text-muted)]/20 font-mono text-[0.75rem]">
              <p className="text-[var(--text-dim)] mb-1 uppercase text-[0.65rem]">
                Fee Calculation:
              </p>
              <div className="flex flex-col gap-1">
                <code className="text-[var(--text-primary)]">
                  {formatEther(fees.base)} ETH + (Message Length x{" "}
                  {formatEther(fees.perChar)} ETH)
                </code>
              </div>
            </div>
            <p className="leading-relaxed">
              Fees are split{" "}
              <span className="text-[var(--text-primary)] font-bold">
                80:20
              </span>{" "}
              between the{" "}
              <span className="text-[var(--text-primary)]">Chat Creator</span>{" "}
              and the protocol. Protocol fees are used for burning{" "}
              <span className="text-[var(--text-primary)] font-bold">
                $ONCHAT
              </span>{" "}
              tokens.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
