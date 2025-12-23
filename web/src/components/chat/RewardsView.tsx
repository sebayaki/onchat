"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { formatEther } from "viem";
import { formatNumber } from "@/helpers/format";
import {
  getMessageFeeBase,
  getMessageFeePerChar,
  getTreasuryBalance,
  getBurnStats,
  type BurnStats,
  burnProtocolFees,
  waitForTransaction,
} from "@/helpers/contracts";
import { useWalletClient } from "wagmi";

export function RewardsView({
  ownerBalance,
  claimingBalance,
  handleClaim,
}: {
  ownerBalance: bigint;
  claimingBalance: boolean;
  handleClaim: () => Promise<void>;
}) {
  const { data: walletClient } = useWalletClient();
  const [fees, setFees] = useState<{ base: bigint; perChar: bigint }>({
    base: BigInt(0),
    perChar: BigInt(0),
  });
  const [treasuryBalance, setTreasuryBalance] = useState<bigint>(BigInt(0));
  const [burnStats, setBurnStats] = useState<BurnStats | null>(null);
  const [burning, setBurning] = useState(false);

  async function loadProtocolInfo() {
    try {
      const [tBalance, stats] = await Promise.all([
        getTreasuryBalance(),
        getBurnStats(),
      ]);
      setTreasuryBalance(tBalance);
      setBurnStats(stats);
    } catch (err) {
      console.error("Failed to load protocol info:", err);
    }
  }

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
    loadProtocolInfo();
  }, []);

  const handleBurn = async () => {
    if (!walletClient) return;
    try {
      setBurning(true);
      const hash = await burnProtocolFees(walletClient);
      await waitForTransaction(hash);
      await loadProtocolInfo();
    } catch (err) {
      console.error("Failed to burn:", err);
    } finally {
      setBurning(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto px-6 py-8 bg-[var(--bg-primary)] font-mono flex flex-col items-center">
      <div className="w-full max-w-5xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Creator Rewards Section */}
          <div>
            <h2 className="text-[var(--text-primary)] uppercase tracking-[2px] mb-6 border-b border-[var(--bg-tertiary)] pb-2">
              Creator Rewards
            </h2>
            <div className="bg-[var(--bg-secondary)] border border-[var(--text-muted)] p-8 rounded-sm mb-8">
              <p className="text-[var(--text-dim)] text-[0.85rem] mb-4 uppercase tracking-[1px]">
                Claimable Balance
              </p>
              <div className="text-2xl md:text-4xl font-bold text-[var(--text-primary)] mb-8">
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
                <span className="font-bold text-[var(--text-primary)] uppercase tracking-wider">
                  How you earn
                </span>
              </div>
              <div className="space-y-4 pl-6">
                <p>
                  Rewards are earned from message fees in the channels you
                  created.
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
                  <span className="text-[var(--text-primary)]">
                    Chat Creator
                  </span>{" "}
                  and the protocol. Protocol fees are used for burning{" "}
                  <span className="text-[var(--text-primary)] font-bold">
                    $ONCHAT
                  </span>{" "}
                  tokens.
                </p>
              </div>
            </div>
          </div>

          {/* Burn Protocol Fee Section */}
          <div>
            <h2 className="text-[var(--color-action)] uppercase tracking-[2px] mb-6 border-b border-[var(--bg-tertiary)] pb-2 flex items-center gap-2">
              Burn Protocol Fee
            </h2>

            <div className="bg-[var(--bg-secondary)] border border-[var(--color-action)]/30 p-8 rounded-sm mb-8">
              <p className="text-[var(--text-dim)] text-[0.85rem] mb-4 uppercase tracking-[1px]">
                Protocol Treasury Balance
              </p>
              <div className="text-2xl md:text-4xl font-bold text-[var(--color-action)] mb-8">
                {formatNumber(treasuryBalance, { fromDecimals: 18 })}{" "}
                <span className="text-xl font-normal opacity-70">ETH</span>
              </div>
              <button
                className="w-full bg-[var(--color-action)] text-[var(--bg-primary)] border-none py-4 text-lg font-bold cursor-pointer transition-all hover:bg-[var(--color-action)]/80 disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider"
                onClick={handleBurn}
                disabled={burning || treasuryBalance === BigInt(0)}
              >
                {burning ? "Burning..." : "Burn Protocol Fees"}
              </button>
            </div>

            {burnStats && (
              <div className="grid grid-cols-2 gap-4 mb-8 text-[var(--color-action)]">
                <div className="bg-[var(--bg-tertiary)]/20 p-4 border border-[var(--color-action)]/10 rounded-sm">
                  <p className="text-[var(--text-dim)] text-[0.65rem] uppercase mb-1">
                    Total ONCHAT Burned
                  </p>
                  <p className="text-lg md:text-xl font-bold">
                    {formatNumber(burnStats.totalOnchatBurned, {
                      fromDecimals: 18,
                    })}
                  </p>
                  <p className="text-[var(--text-dim)] text-[0.6rem] mt-1">
                    {(
                      (Number(burnStats.totalOnchatBurned) / 1e18 / 21000000) *
                      100
                    ).toFixed(4)}
                    % of max supply
                  </p>
                </div>
                <div className="bg-[var(--bg-tertiary)]/20 p-4 border border-[var(--color-action)]/10 rounded-sm">
                  <p className="text-[var(--text-dim)] text-[0.65rem] uppercase mb-1">
                    Total ETH Spent
                  </p>
                  <p className="text-lg md:text-xl font-bold">
                    {formatNumber(burnStats.totalEthSpent, {
                      fromDecimals: 18,
                    })}
                  </p>
                </div>
                <div className="bg-[var(--bg-tertiary)]/20 p-4 border border-[var(--color-action)]/10 rounded-sm">
                  <p className="text-[var(--text-dim)] text-[0.65rem] uppercase mb-1">
                    Total HUNT Spent
                  </p>
                  <p className="text-lg md:text-xl font-bold">
                    {formatNumber(burnStats.totalHuntSpent, {
                      fromDecimals: 18,
                    })}
                  </p>
                </div>
                <div className="bg-[var(--bg-tertiary)]/20 p-4 border border-[var(--color-action)]/10 rounded-sm">
                  <p className="text-[var(--text-dim)] text-[0.65rem] uppercase mb-1">
                    Burn Count
                  </p>
                  <p className="text-lg md:text-xl font-bold">
                    {burnStats.burnCount.toString()}
                  </p>
                </div>
              </div>
            )}

            <div className="text-[var(--text-muted)] text-[0.85rem] bg-[var(--bg-tertiary)]/30 p-5 border-l-2 border-[var(--color-action)] mb-12">
              <div className="flex items-start gap-2 mb-3">
                <span className="font-bold text-[var(--color-action)] uppercase tracking-wider">
                  How it works
                </span>
              </div>
              <div className="space-y-4 pl-6 text-[var(--color-action)]/80">
                <p>
                  The protocol treasury accumulates 20% of all message fees.
                  Anyone can trigger the burn function to buy back and burn
                  $ONCHAT.
                </p>
                <p className="leading-relaxed">
                  When the burn function is triggered, all ETH in the treasury
                  is:
                </p>
                <ol className="list-decimal space-y-2 ml-6">
                  <li>
                    Swapped for{" "}
                    <span className="text-[var(--color-action)] font-bold">
                      $ONCHAT
                    </span>{" "}
                    via Mint Club
                  </li>
                  <li>
                    Sent directly to the{" "}
                    <span className="text-[var(--color-action)] font-bold">
                      0x00...dEaD
                    </span>{" "}
                    address to be burned
                  </li>
                </ol>
                <p className="leading-relaxed italic text-[0.75rem]">
                  OnChat is a Hunt Town Co-op app - no business model, and 100%
                  of revenue goes to burning tokens.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
