import { basePublicClient } from "@/configs/viem";

/**
 * Check if an error indicates the user rejected the transaction
 * @param error - The error to check
 * @returns True if the error indicates user rejection
 */
export function isUserRejectedError(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }

  const errorObj = error as Record<string, unknown>;

  // Check error code (MetaMask uses 4001 for user rejection)
  if ("code" in errorObj && errorObj.code === 4001) {
    return true;
  }

  // Check error message for rejection keywords (check both message and shortMessage)
  const checkMessage = (msg: string): boolean => {
    const lowerMsg = msg.toLowerCase();
    return (
      lowerMsg.includes("user rejected") ||
      lowerMsg.includes("user denied") ||
      lowerMsg.includes("transaction rejected by user") ||
      lowerMsg.includes("user cancelled") ||
      lowerMsg.includes("user canceled") ||
      lowerMsg.includes("denied transaction signature") ||
      lowerMsg.includes("rejected the request")
    );
  };

  if ("message" in errorObj && typeof errorObj.message === "string") {
    if (checkMessage(errorObj.message)) {
      return true;
    }
  }

  if ("shortMessage" in errorObj && typeof errorObj.shortMessage === "string") {
    if (checkMessage(errorObj.shortMessage)) {
      return true;
    }
  }

  // Check details property (viem sometimes puts error details here)
  if ("details" in errorObj && typeof errorObj.details === "string") {
    if (checkMessage(errorObj.details)) {
      return true;
    }
  }

  // Check if error has a cause that might be a user rejection
  if ("cause" in errorObj && errorObj.cause) {
    if (isUserRejectedError(errorObj.cause)) {
      return true;
    }
  }

  return false;
}

/**
 * Handle transaction errors.
 * Returns null if the user rejected the transaction (should be ignored).
 * Returns the error message string if it's a real error that should be shown to the user.
 * @param error - The error to handle
 * @returns Error message string or null if user rejected
 */
export function handleTransactionError(error: unknown): string | null {
  if (isUserRejectedError(error)) {
    return "User cancelled the transaction.";
  }

  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}

/**
 * Error that indicates a transaction reverted on-chain
 */
export class TransactionRevertedError extends Error {
  constructor(message = "Transaction failed. Please try again.") {
    super(message);
    this.name = "TransactionRevertedError";
  }
}

/**
 * Wait for transaction receipt and check for revert status.
 * Uses basePublicClient to wait for the transaction.
 * Throws TransactionRevertedError if the transaction reverted on-chain.
 * @param hash - The transaction hash to wait for
 * @returns The transaction receipt
 * @throws TransactionRevertedError if transaction reverted
 */
export async function waitForTransaction(hash: `0x${string}`) {
  const receipt = await basePublicClient.waitForTransactionReceipt({ hash });
  if (receipt.status === "reverted") {
    throw new TransactionRevertedError();
  }
  return receipt;
}
