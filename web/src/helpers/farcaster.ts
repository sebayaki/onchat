import { cache } from "@/helpers/cache";

export interface FarcasterUserProfile {
  fid: number;
  username: string;
  addresses: string[];
  displayName: string;
  pfpUrl: string | null;
  proSubscribed: boolean;
  twitter?: string | null;
  github?: string | null;
  followersCount: number;
  followingCount: number;
  spamLabel: number;
}

export async function fetchUserProfilesBulk(
  walletAddresses: string[]
): Promise<Record<string, FarcasterUserProfile | null>> {
  if (walletAddresses.length === 0) {
    return {};
  }

  // Add farcaster: prefix to keys for namespace isolation
  const prefixedKeys = walletAddresses.map((addr) => `farcaster:${addr}`);

  // Use getMany from the cache utility which handles caching and race conditions
  const result = await cache.getMany(
    prefixedKeys,
    async (keys) => {
      // Remove prefix to get original wallet addresses for API call
      const originalAddresses = keys.map((key) =>
        key.replace("farcaster:", "")
      );

      const response = await fetch(
        `https://fc.hunt.town/users/byWallets/${originalAddresses.join(",")}`
      );

      if (!response.ok) {
        console.warn(
          `Failed to fetch user profiles in bulk (${response.status})`
        );
        // Return empty object, which will result in null being cached for these addresses
        return {};
      }

      const data: Array<FarcasterUserProfile> = await response.json();

      // Convert array to Record<string, FarcasterUserProfile | null>
      // Match profiles to addresses by checking the addresses array in each profile
      const profileMap: Record<string, FarcasterUserProfile | null> = {};

      // For each returned profile, map all its addresses to this profile
      data.forEach((item) => {
        const profile: FarcasterUserProfile = {
          fid: item.fid,
          username: item.username,
          addresses: item.addresses ?? [],
          displayName: item.displayName,
          pfpUrl: item.pfpUrl ?? null,
          proSubscribed: item.proSubscribed,
          twitter: item.twitter ?? null,
          github: item.github ?? null,
          followersCount: item.followersCount,
          followingCount: item.followingCount,
          spamLabel: item.spamLabel,
        };

        // Match this profile to any of the queried addresses
        // by checking if any queried address is in the profile's addresses array
        originalAddresses.forEach((queriedAddr, index) => {
          const queriedAddrLower = queriedAddr.toLowerCase();
          const profileAddressesLower = item.addresses.map((addr) =>
            addr.toLowerCase()
          );

          if (profileAddressesLower.includes(queriedAddrLower)) {
            profileMap[keys[index]] = profile;
          }
        });
      });

      return profileMap;
    },
    600 // 10 minutes
  );

  // Return the full mapping with prefixes removed
  const finalMap: Record<string, FarcasterUserProfile | null> = {};
  Object.entries(result).forEach(([key, value]) => {
    const address = key.replace("farcaster:", "");
    finalMap[address.toLowerCase()] = value;
  });

  return finalMap;
}
