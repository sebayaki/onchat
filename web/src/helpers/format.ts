import { formatEther } from "viem";

/**
 * Format address for display (0x1234...5678)
 */
export function formatAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * Format number with comma separators
 * @param value - The number or bigint to format
 * @param options - Formatting options
 * @param options.decimals - Number of decimal places in output. If not specified, shows up to 4 significant digits after decimal (max 8 decimals)
 * @param options.fromDecimals - For bigint values: number of decimals to divide by (e.g., 18 for wei). If not specified, bigint is treated as a whole number.
 * @returns Formatted string with comma separators (e.g., "115,113.2647")
 *
 * @example
 * formatNumber(1234567) // "1,234,567"
 * formatNumber(1234567n) // "1,234,567"
 * formatNumber(1000000000000000000n, { fromDecimals: 18 }) // "1" (1 ETH in wei)
 * formatNumber(1.5, { decimals: 2 }) // "1.50"
 */
export function formatNumber(
  value: number | bigint,
  options?: { decimals?: number; fromDecimals?: number }
): string {
  const { decimals: outputDecimals, fromDecimals } = options ?? {};

  // Convert bigint to number
  let num: number;
  if (typeof value === "bigint") {
    if (fromDecimals !== undefined) {
      // Divide by 10^fromDecimals (e.g., wei to ETH)
      num = parseFloat(formatEther(value * BigInt(10 ** (18 - fromDecimals))));
    } else {
      // Treat as whole number
      num = Number(value);
    }
  } else {
    num = value;
  }

  let decimals = outputDecimals;

  // Calculate decimal places if not specified
  if (decimals === undefined) {
    const decimalStr = num.toFixed(20).split(".")[1] || "";
    const firstNonZero = decimalStr.search(/[1-9]/);

    if (firstNonZero === -1) {
      decimals = 0; // All zeros after decimal
    } else {
      // Count 4 non-zero digits from first non-zero position
      let nonZeroCount = 0;
      let lastIndex = firstNonZero;
      for (
        let i = firstNonZero;
        i < decimalStr.length && nonZeroCount < 4;
        i++
      ) {
        if (decimalStr[i] !== "0") nonZeroCount++;
        lastIndex = i;
      }
      decimals = Math.min(lastIndex + 1, 8);
    }
  }

  // Format once with calculated decimals
  const formatted = num.toFixed(decimals);
  const [integerPart, decimalPart] = formatted.split(".");
  const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");

  return decimalPart ? `${formattedInteger}.${decimalPart}` : formattedInteger;
}

/**
 * Format date/time for display (HH:mm)
 */
export function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}
