import { useReadContract } from "wagmi";

// ERC-8004 Agent Registry on Base
const ERC8004_REGISTRY = "0x8004A169FB4a3325136EB29fA0ceB6D2e539a432" as const;

// ERC-721 balanceOf ABI for checking registration
const ERC721_BALANCE_ABI = [
  {
    type: "function",
    name: "balanceOf",
    inputs: [{ name: "owner", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
] as const;

/**
 * Hook to check if an address is registered in ERC-8004 Agent Registry
 * @param address - The address to check
 * @returns boolean indicating if the address is a registered agent
 */
export function useIsERC8004Registered(address: string | undefined): boolean {
  const { data: balance } = useReadContract({
    address: ERC8004_REGISTRY,
    abi: ERC721_BALANCE_ABI,
    functionName: "balanceOf",
    args: address ? [address as `0x${string}`] : undefined,
    query: {
      enabled: !!address,
      staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    },
  });

  return balance !== undefined && balance > 0n;
}
