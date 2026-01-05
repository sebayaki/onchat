import { basePublicClient } from "@/configs/viem";
import { ONCHAT_ABI, ONCHAT_BUYBACK_BURNER_ABI } from "@/configs/abis";
import { CONTRACTS, MESSAGES_PER_PAGE } from "@/configs/constants";
import { type WalletClient, keccak256, toBytes } from "viem";
import { base } from "viem/chains";
import { formatNumber } from "./format";
export { waitForTransaction } from "./transactions";

// ============================================================================
// Types
// ============================================================================

export interface ChannelInfo {
  slugHash: `0x${string}`;
  slug: string;
  owner: `0x${string}`;
  createdAt: number;
  memberCount: bigint;
  messageCount: bigint;
}

export interface Message {
  sender: `0x${string}`;
  timestamp: number;
  isHidden: boolean;
  content: string;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Compute slug hash from slug string (client-side)
 */
export function computeSlugHash(slug: string): `0x${string}` {
  return keccak256(toBytes(slug));
}

/**
 * Ensure the wallet is connected to Base chain
 */
async function ensureBaseChain(walletClient: WalletClient): Promise<void> {
  if (!walletClient.account) {
    throw new Error("Wallet not connected");
  }

  if (walletClient.chain?.id !== base.id) {
    console.log("📜 Switching to Base...");
    await walletClient.switchChain({ id: base.id });
  }
}

// ============================================================================
// Read Functions
// ============================================================================

/**
 * Get wallet ETH balance
 */
export async function getWalletBalance(
  address: `0x${string}`
): Promise<bigint> {
  return await basePublicClient.getBalance({ address });
}

/**
 * Get channel creation fee
 */
export async function getChannelCreationFee(): Promise<bigint> {
  const fee = await basePublicClient.readContract({
    address: CONTRACTS.ONCHAT_ADDRESS,
    abi: ONCHAT_ABI,
    functionName: "channelCreationFee",
  });
  return fee as bigint;
}

/**
 * Get message fee base
 */
export async function getMessageFeeBase(): Promise<bigint> {
  const fee = await basePublicClient.readContract({
    address: CONTRACTS.ONCHAT_ADDRESS,
    abi: ONCHAT_ABI,
    functionName: "messageFeeBase",
  });
  return fee as bigint;
}

/**
 * Get message fee per character
 */
export async function getMessageFeePerChar(): Promise<bigint> {
  const fee = await basePublicClient.readContract({
    address: CONTRACTS.ONCHAT_ADDRESS,
    abi: ONCHAT_ABI,
    functionName: "messageFeePerChar",
  });
  return fee as bigint;
}

/**
 * Calculate message fee for a given content
 */
export async function calculateMessageFee(content: string): Promise<bigint> {
  const contentLength = new TextEncoder().encode(content).length;
  const fee = await basePublicClient.readContract({
    address: CONTRACTS.ONCHAT_ADDRESS,
    abi: ONCHAT_ABI,
    functionName: "calculateMessageFee",
    args: [BigInt(contentLength)],
  });
  return fee as bigint;
}

/**
 * Get total channel count
 */
export async function getChannelCount(): Promise<bigint> {
  const count = await basePublicClient.readContract({
    address: CONTRACTS.ONCHAT_ADDRESS,
    abi: ONCHAT_ABI,
    functionName: "getChannelCount",
  });
  return count as bigint;
}

/**
 * Get channel info by slug hash
 */
export async function getChannel(
  slugHash: `0x${string}`
): Promise<ChannelInfo> {
  const result = await basePublicClient.readContract({
    address: CONTRACTS.ONCHAT_ADDRESS,
    abi: ONCHAT_ABI,
    functionName: "getChannel",
    args: [slugHash],
  });

  const info = result as {
    slugHash: `0x${string}`;
    slug: string;
    owner: `0x${string}`;
    createdAt: number;
    memberCount: bigint;
    messageCount: bigint;
  };

  return {
    slugHash: info.slugHash,
    slug: info.slug,
    owner: info.owner,
    createdAt: Number(info.createdAt),
    memberCount: info.memberCount,
    messageCount: info.messageCount,
  };
}

/**
 * Get channel info by slug
 */
export async function getChannelBySlug(slug: string): Promise<ChannelInfo> {
  const slugHash = computeSlugHash(slug);
  return getChannel(slugHash);
}

/**
 * Get latest channels with pagination, sorted by member count (descending)
 */
export async function getLatestChannels(
  offset: number = 0,
  limit: number = MESSAGES_PER_PAGE
): Promise<ChannelInfo[]> {
  const result = await basePublicClient.readContract({
    address: CONTRACTS.ONCHAT_ADDRESS,
    abi: ONCHAT_ABI,
    functionName: "getLatestChannels",
    args: [BigInt(offset), BigInt(limit)],
  });

  return (result as ChannelInfo[])
    .map((info) => ({
      slugHash: info.slugHash,
      slug: info.slug,
      owner: info.owner,
      createdAt: Number(info.createdAt),
      memberCount: info.memberCount,
      messageCount: info.messageCount,
    }))
    .sort((a, b) => {
      if (b.messageCount > a.messageCount) return 1;
      if (b.messageCount < a.messageCount) return -1;
      return 0;
    });
}

/**
 * Get all channels by paginating until the end, sorted by message count (descending)
 */
export async function getAllChannels(): Promise<ChannelInfo[]> {
  const totalCount = await getChannelCount();
  const total = Number(totalCount);

  if (total === 0) return [];

  const batchSize = MESSAGES_PER_PAGE;
  const offsets: number[] = [];
  for (let offset = 0; offset < total; offset += batchSize) {
    offsets.push(offset);
  }

  const batches = await Promise.all(
    offsets.map((offset) => getLatestChannels(offset, batchSize))
  );

  // Sort all channels by message count descending
  return batches.flat().sort((a, b) => {
    if (b.messageCount > a.messageCount) return 1;
    if (b.messageCount < a.messageCount) return -1;
    return 0;
  });
}

/**
 * Get message count for a channel
 */
export async function getMessageCount(
  slugHash: `0x${string}`
): Promise<bigint> {
  const count = await basePublicClient.readContract({
    address: CONTRACTS.ONCHAT_ADDRESS,
    abi: ONCHAT_ABI,
    functionName: "getMessageCount",
    args: [slugHash],
  });
  return count as bigint;
}

/**
 * Get latest messages from a channel (newest first)
 */
export async function getLatestMessages(
  slugHash: `0x${string}`,
  offset: number = 0,
  limit: number = MESSAGES_PER_PAGE
): Promise<Message[]> {
  const result = await basePublicClient.readContract({
    address: CONTRACTS.ONCHAT_ADDRESS,
    abi: ONCHAT_ABI,
    functionName: "getLatestMessages",
    args: [slugHash, BigInt(offset), BigInt(limit)],
  });

  return (result as Message[]).map((msg) => ({
    sender: msg.sender,
    timestamp: Number(msg.timestamp),
    isHidden: msg.isHidden,
    content: msg.content,
  }));
}

/**
 * Get messages in a specific range (oldest first)
 */
export async function getMessagesRange(
  slugHash: `0x${string}`,
  startIndex: number,
  endIndex: number
): Promise<Message[]> {
  const result = await basePublicClient.readContract({
    address: CONTRACTS.ONCHAT_ADDRESS,
    abi: ONCHAT_ABI,
    functionName: "getMessagesRange",
    args: [slugHash, BigInt(startIndex), BigInt(endIndex)],
  });

  return (result as Message[]).map((msg) => ({
    sender: msg.sender,
    timestamp: Number(msg.timestamp),
    isHidden: msg.isHidden,
    content: msg.content,
  }));
}

/**
 * Get channel members with pagination
 */
export async function getChannelMembers(
  slugHash: `0x${string}`,
  offset: number = 0,
  limit: number = 100
): Promise<`0x${string}`[]> {
  const result = await basePublicClient.readContract({
    address: CONTRACTS.ONCHAT_ADDRESS,
    abi: ONCHAT_ABI,
    functionName: "getChannelMembers",
    args: [slugHash, BigInt(offset), BigInt(limit)],
  });
  return result as `0x${string}`[];
}

/**
 * Get moderator count for a channel
 */
export async function getModeratorCount(
  slugHash: `0x${string}`
): Promise<bigint> {
  const result = await basePublicClient.readContract({
    address: CONTRACTS.ONCHAT_ADDRESS,
    abi: ONCHAT_ABI,
    functionName: "getModeratorCount",
    args: [slugHash],
  });
  return result as bigint;
}

/**
 * Get channel moderators with pagination
 */
export async function getChannelModerators(
  slugHash: `0x${string}`,
  offset: number = 0,
  limit: number = 100
): Promise<`0x${string}`[]> {
  const result = await basePublicClient.readContract({
    address: CONTRACTS.ONCHAT_ADDRESS,
    abi: ONCHAT_ABI,
    functionName: "getChannelModerators",
    args: [slugHash, BigInt(offset), BigInt(limit)],
  });
  return result as `0x${string}`[];
}

/**
 * Get banned user count for a channel
 */
export async function getBannedUserCount(
  slugHash: `0x${string}`
): Promise<bigint> {
  const result = await basePublicClient.readContract({
    address: CONTRACTS.ONCHAT_ADDRESS,
    abi: ONCHAT_ABI,
    functionName: "getBannedUserCount",
    args: [slugHash],
  });
  return result as bigint;
}

/**
 * Get banned users for a channel with pagination
 */
export async function getBannedUsers(
  slugHash: `0x${string}`,
  offset: number = 0,
  limit: number = 100
): Promise<`0x${string}`[]> {
  const result = await basePublicClient.readContract({
    address: CONTRACTS.ONCHAT_ADDRESS,
    abi: ONCHAT_ABI,
    functionName: "getBannedUsers",
    args: [slugHash, BigInt(offset), BigInt(limit)],
  });
  return result as `0x${string}`[];
}

/**
 * Get channels joined by a user
 */
export async function getUserChannels(
  user: `0x${string}`,
  offset: number = 0,
  limit: number = 100
): Promise<`0x${string}`[]> {
  const result = await basePublicClient.readContract({
    address: CONTRACTS.ONCHAT_ADDRESS,
    abi: ONCHAT_ABI,
    functionName: "getUserChannels",
    args: [user, BigInt(offset), BigInt(limit)],
  });
  return result as `0x${string}`[];
}

/**
 * Get count of channels joined by a user
 */
export async function getUserChannelCount(
  user: `0x${string}`
): Promise<bigint> {
  const result = await basePublicClient.readContract({
    address: CONTRACTS.ONCHAT_ADDRESS,
    abi: ONCHAT_ABI,
    functionName: "getUserChannelCount",
    args: [user],
  });
  return result as bigint;
}

/**
 * Check if user is a member of a channel
 */
export async function isMember(
  slugHash: `0x${string}`,
  user: `0x${string}`
): Promise<boolean> {
  const result = await basePublicClient.readContract({
    address: CONTRACTS.ONCHAT_ADDRESS,
    abi: ONCHAT_ABI,
    functionName: "isMember",
    args: [slugHash, user],
  });
  return result as boolean;
}

/**
 * Check if user is a moderator of a channel
 */
export async function isModerator(
  slugHash: `0x${string}`,
  user: `0x${string}`
): Promise<boolean> {
  const result = await basePublicClient.readContract({
    address: CONTRACTS.ONCHAT_ADDRESS,
    abi: ONCHAT_ABI,
    functionName: "isModerator",
    args: [slugHash, user],
  });
  return result as boolean;
}

/**
 * Check if user is banned from a channel
 */
export async function isBanned(
  slugHash: `0x${string}`,
  user: `0x${string}`
): Promise<boolean> {
  const result = await basePublicClient.readContract({
    address: CONTRACTS.ONCHAT_ADDRESS,
    abi: ONCHAT_ABI,
    functionName: "isBanned",
    args: [slugHash, user],
  });
  return result as boolean;
}

/**
 * Get owner's claimable balance
 */
export async function getOwnerBalance(owner: `0x${string}`): Promise<bigint> {
  const result = await basePublicClient.readContract({
    address: CONTRACTS.ONCHAT_ADDRESS,
    abi: ONCHAT_ABI,
    functionName: "ownerBalances",
    args: [owner],
  });
  return result as bigint;
}

/**
 * Get protocol treasury balance
 */
export async function getTreasuryBalance(): Promise<bigint> {
  const result = await basePublicClient.readContract({
    address: CONTRACTS.ONCHAT_ADDRESS,
    abi: ONCHAT_ABI,
    functionName: "treasuryBalance",
  });
  return result as bigint;
}

export interface BurnStats {
  totalOnchatBurned: bigint;
  totalHuntSpent: bigint;
  totalEthSpent: bigint;
  burnCount: bigint;
}

/**
 * Get buyback burner stats
 */
export async function getBurnStats(): Promise<BurnStats> {
  const result = await basePublicClient.readContract({
    address: CONTRACTS.ONCHAT_BUYBACK_BURNER_ADDRESS,
    abi: ONCHAT_BUYBACK_BURNER_ABI,
    functionName: "stats",
  });

  return result as BurnStats;
}

/**
 * Get slug from slug hash
 */
export async function getSlugFromHash(
  slugHash: `0x${string}`
): Promise<string> {
  const result = await basePublicClient.readContract({
    address: CONTRACTS.ONCHAT_ADDRESS,
    abi: ONCHAT_ABI,
    functionName: "getSlug",
    args: [slugHash],
  });
  return result as string;
}

// ============================================================================
// Write Functions
// ============================================================================

/**
 * Check if a channel exists by slug
 */
export async function channelExists(slug: string): Promise<boolean> {
  try {
    const channel = await getChannelBySlug(slug);
    // Channel exists if it has a non-empty slug
    return channel.slug.length > 0;
  } catch {
    // Channel doesn't exist
    return false;
  }
}

/**
 * Create a new channel
 */
export async function createChannel(
  walletClient: WalletClient,
  slug: string
): Promise<`0x${string}`> {
  await ensureBaseChain(walletClient);

  // Check if channel already exists
  const exists = await channelExists(slug);
  if (exists) {
    throw new Error(
      `Channel #${slug} already exists. Join it with /join #${slug} or choose a different name.`
    );
  }

  const fee = await getChannelCreationFee();

  // Check wallet balance before proceeding
  const balance = await getWalletBalance(walletClient.account!.address);
  if (balance < fee) {
    throw new Error(
      `Insufficient balance. You need at least ${formatNumber(fee, {
        fromDecimals: 18,
      })} ETH to create a channel (you have ${formatNumber(balance, {
        fromDecimals: 18,
      })} ETH).`
    );
  }

  console.log(
    "📜 Creating channel:",
    slug,
    "Fee:",
    formatNumber(fee, { fromDecimals: 18 }),
    "ETH"
  );

  const hash = await walletClient.writeContract({
    address: CONTRACTS.ONCHAT_ADDRESS,
    abi: ONCHAT_ABI,
    functionName: "createChannel",
    args: [slug],
    account: walletClient.account!,
    chain: base,
    value: fee,
  });

  console.log("📜 createChannel tx:", hash);
  return hash;
}

/**
 * Join a channel
 */
export async function joinChannel(
  walletClient: WalletClient,
  slugHash: `0x${string}`
): Promise<`0x${string}`> {
  await ensureBaseChain(walletClient);

  console.log("📜 Joining channel:", slugHash);

  const hash = await walletClient.writeContract({
    address: CONTRACTS.ONCHAT_ADDRESS,
    abi: ONCHAT_ABI,
    functionName: "joinChannel",
    args: [slugHash],
    account: walletClient.account!,
    chain: base,
  });

  console.log("📜 joinChannel tx:", hash);
  return hash;
}

/**
 * Leave a channel
 */
export async function leaveChannel(
  walletClient: WalletClient,
  slugHash: `0x${string}`
): Promise<`0x${string}`> {
  await ensureBaseChain(walletClient);

  console.log("📜 Leaving channel:", slugHash);

  const hash = await walletClient.writeContract({
    address: CONTRACTS.ONCHAT_ADDRESS,
    abi: ONCHAT_ABI,
    functionName: "leaveChannel",
    args: [slugHash],
    account: walletClient.account!,
    chain: base,
  });

  console.log("📜 leaveChannel tx:", hash);
  return hash;
}

/**
 * Send a message to a channel
 */
export async function sendMessage(
  walletClient: WalletClient,
  slugHash: `0x${string}`,
  content: string
): Promise<`0x${string}`> {
  await ensureBaseChain(walletClient);

  const fee = await calculateMessageFee(content);

  console.log(
    "📜 Sending message, fee:",
    formatNumber(fee, { fromDecimals: 18 }),
    "ETH"
  );

  const hash = await walletClient.writeContract({
    address: CONTRACTS.ONCHAT_ADDRESS,
    abi: ONCHAT_ABI,
    functionName: "sendMessage",
    args: [slugHash, content],
    account: walletClient.account!,
    chain: base,
    value: fee,
  });

  console.log("📜 sendMessage tx:", hash);
  return hash;
}

/**
 * Hide a message (owner/moderator only)
 */
export async function hideMessage(
  walletClient: WalletClient,
  slugHash: `0x${string}`,
  messageIndex: number
): Promise<`0x${string}`> {
  await ensureBaseChain(walletClient);

  console.log("📜 Hiding message:", messageIndex);

  const hash = await walletClient.writeContract({
    address: CONTRACTS.ONCHAT_ADDRESS,
    abi: ONCHAT_ABI,
    functionName: "hideMessage",
    args: [slugHash, BigInt(messageIndex)],
    account: walletClient.account!,
    chain: base,
  });

  console.log("📜 hideMessage tx:", hash);
  return hash;
}

/**
 * Unhide a message (owner/moderator only)
 */
export async function unhideMessage(
  walletClient: WalletClient,
  slugHash: `0x${string}`,
  messageIndex: number
): Promise<`0x${string}`> {
  await ensureBaseChain(walletClient);

  console.log("📜 Unhiding message:", messageIndex);

  const hash = await walletClient.writeContract({
    address: CONTRACTS.ONCHAT_ADDRESS,
    abi: ONCHAT_ABI,
    functionName: "unhideMessage",
    args: [slugHash, BigInt(messageIndex)],
    account: walletClient.account!,
    chain: base,
  });

  console.log("📜 unhideMessage tx:", hash);
  return hash;
}

/**
 * Ban a user from a channel (owner/moderator only)
 */
export async function banUser(
  walletClient: WalletClient,
  slugHash: `0x${string}`,
  user: `0x${string}`
): Promise<`0x${string}`> {
  await ensureBaseChain(walletClient);

  console.log("📜 Banning user:", user);

  const hash = await walletClient.writeContract({
    address: CONTRACTS.ONCHAT_ADDRESS,
    abi: ONCHAT_ABI,
    functionName: "banUser",
    args: [slugHash, user],
    account: walletClient.account!,
    chain: base,
  });

  console.log("📜 banUser tx:", hash);
  return hash;
}

/**
 * Unban a user from a channel (owner/moderator only)
 */
export async function unbanUser(
  walletClient: WalletClient,
  slugHash: `0x${string}`,
  user: `0x${string}`
): Promise<`0x${string}`> {
  await ensureBaseChain(walletClient);

  console.log("📜 Unbanning user:", user);

  const hash = await walletClient.writeContract({
    address: CONTRACTS.ONCHAT_ADDRESS,
    abi: ONCHAT_ABI,
    functionName: "unbanUser",
    args: [slugHash, user],
    account: walletClient.account!,
    chain: base,
  });

  console.log("📜 unbanUser tx:", hash);
  return hash;
}

/**
 * Add a moderator (owner only)
 */
export async function addModerator(
  walletClient: WalletClient,
  slugHash: `0x${string}`,
  moderator: `0x${string}`
): Promise<`0x${string}`> {
  await ensureBaseChain(walletClient);

  console.log("📜 Adding moderator:", moderator);

  const hash = await walletClient.writeContract({
    address: CONTRACTS.ONCHAT_ADDRESS,
    abi: ONCHAT_ABI,
    functionName: "addModerator",
    args: [slugHash, moderator],
    account: walletClient.account!,
    chain: base,
  });

  console.log("📜 addModerator tx:", hash);
  return hash;
}

/**
 * Remove a moderator (owner only)
 */
export async function removeModerator(
  walletClient: WalletClient,
  slugHash: `0x${string}`,
  moderator: `0x${string}`
): Promise<`0x${string}`> {
  await ensureBaseChain(walletClient);

  console.log("📜 Removing moderator:", moderator);

  const hash = await walletClient.writeContract({
    address: CONTRACTS.ONCHAT_ADDRESS,
    abi: ONCHAT_ABI,
    functionName: "removeModerator",
    args: [slugHash, moderator],
    account: walletClient.account!,
    chain: base,
  });

  console.log("📜 removeModerator tx:", hash);
  return hash;
}

/**
 * Claim owner balance
 */
export async function claimOwnerBalance(
  walletClient: WalletClient
): Promise<`0x${string}`> {
  await ensureBaseChain(walletClient);

  console.log("📜 Claiming owner balance");

  const hash = await walletClient.writeContract({
    address: CONTRACTS.ONCHAT_ADDRESS,
    abi: ONCHAT_ABI,
    functionName: "claimOwnerBalance",
    args: [],
    account: walletClient.account!,
    chain: base,
  });

  console.log("📜 claimOwnerBalance tx:", hash);
  return hash;
}

/**
 * Burn protocol fees
 */
export async function burnProtocolFees(
  walletClient: WalletClient
): Promise<`0x${string}`> {
  await ensureBaseChain(walletClient);

  console.log("📜 Burning protocol fees...");

  const hash = await walletClient.writeContract({
    address: CONTRACTS.ONCHAT_BUYBACK_BURNER_ADDRESS,
    abi: ONCHAT_BUYBACK_BURNER_ABI,
    functionName: "burn",
    args: [],
    account: walletClient.account!,
    chain: base,
  });

  console.log("📜 burnProtocolFees tx:", hash);
  return hash;
}
