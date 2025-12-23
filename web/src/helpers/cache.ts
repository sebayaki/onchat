/**
 * Singleton Memory Cache
 *
 * A global in-memory cache with expiry timestamps and race-condition handling.
 * This is a true singleton - only one instance exists globally.
 *
 * Features:
 * - Automatic expiry based on TTL (time-to-live)
 * - Race-condition prevention for concurrent requests
 * - Case-insensitive key storage (keys are normalized to lowercase)
 * - Support for single and bulk operations
 * - Accessible globally via window.SingletonMemoryCache
 *
 * @example
 * ```typescript
 * import { cache } from '@/lib/singleton-memory-cache';
 *
 * // Fetch single item (with automatic caching)
 * const user = await cache.get('user-123', async () => {
 *   return await fetchUserFromAPI('user-123');
 * }, 600); // 10 minutes TTL
 *
 * // Fetch multiple items (only fetches uncached ones)
 * const users = await cache.getMany(['wallet-1', 'wallet-2'], async (keys) => {
 *   const data = await fetchUsersFromAPI(keys);
 *   return { 'wallet-1': data[0], 'wallet-2': data[1] };
 * }, 600);
 * ```
 */

interface CacheEntry {
  value: unknown;
  expiryTimestamp: number; // Unix timestamp in milliseconds
}

class SingletonMemoryCache {
  private cache: Record<string, CacheEntry> = {};
  private inFlightRequests: Record<string, Promise<unknown>> = {};
  private defaultTTL: number; // Time to live in milliseconds

  /**
   * Create the singleton cache instance
   * @param defaultTTLSeconds Default time-to-live in seconds (default: 3600s = 1 hour)
   */
  constructor(defaultTTLSeconds: number = 3600) {
    this.defaultTTL = defaultTTLSeconds * 1000;
  }

  /**
   * Get a value from cache or execute fetcher if not cached/expired.
   * Prevents duplicate concurrent requests for the same key.
   *
   * @param key Cache key (will be normalized to lowercase)
   * @param fetcher Async function to fetch the value if not cached
   * @param ttlSeconds Optional custom TTL in seconds (overrides default)
   * @returns The cached or fetched value
   */
  async get<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttlSeconds?: number
  ): Promise<T> {
    const normalizedKey = key.toLowerCase();

    // Check if cached and not expired
    if (normalizedKey in this.cache) {
      const entry = this.cache[normalizedKey];
      if (Date.now() < entry.expiryTimestamp) {
        return entry.value as T;
      } else {
        // Expired, remove from cache
        delete this.cache[normalizedKey];
      }
    }

    // Check if already fetching (race condition handling)
    if (normalizedKey in this.inFlightRequests) {
      return this.inFlightRequests[normalizedKey] as Promise<T>;
    }

    // Start new fetch and track it
    const fetchPromise = (async () => {
      try {
        const value = await fetcher();
        const ttl =
          ttlSeconds !== undefined ? ttlSeconds * 1000 : this.defaultTTL;

        // Cache the result with expiry
        this.cache[normalizedKey] = {
          value,
          expiryTimestamp: Date.now() + ttl,
        };

        return value;
      } finally {
        // Clean up in-flight tracking
        delete this.inFlightRequests[normalizedKey];
      }
    })();

    // Track this request
    this.inFlightRequests[normalizedKey] = fetchPromise;

    return fetchPromise;
  }

  /**
   * Get multiple values from cache or fetch missing ones.
   * Efficiently handles cached, in-flight, and need-to-fetch items separately.
   *
   * @param keys Array of cache keys (will be normalized to lowercase)
   * @param fetcher Async function that receives uncached keys and returns a key-value map
   * @param ttlSeconds Optional custom TTL in seconds (overrides default)
   * @returns Record of key-value pairs for all requested keys
   */
  async getMany<T>(
    keys: string[],
    fetcher: (keys: string[]) => Promise<Record<string, T>>,
    ttlSeconds?: number
  ): Promise<Record<string, T>> {
    if (keys.length === 0) {
      return {};
    }

    const normalizedKeys = keys.map((k) => k.toLowerCase());
    const now = Date.now();

    // Separate cached, in-flight, and need-to-fetch keys
    const result: Record<string, T> = {};
    const inFlight: Promise<T>[] = [];
    const inFlightKeys: string[] = [];
    const needToFetch: string[] = [];
    const needToFetchOriginal: string[] = [];

    normalizedKeys.forEach((normalizedKey, index) => {
      if (normalizedKey in this.cache) {
        const entry = this.cache[normalizedKey];
        if (now < entry.expiryTimestamp) {
          // Cached and not expired
          result[keys[index]] = entry.value as T;
        } else {
          // Expired, need to fetch
          delete this.cache[normalizedKey];
          needToFetch.push(normalizedKey);
          needToFetchOriginal.push(keys[index]);
        }
      } else if (normalizedKey in this.inFlightRequests) {
        // Already being fetched
        inFlight.push(this.inFlightRequests[normalizedKey] as Promise<T>);
        inFlightKeys.push(keys[index]);
      } else {
        // Need to fetch
        needToFetch.push(normalizedKey);
        needToFetchOriginal.push(keys[index]);
      }
    });

    // Wait for in-flight requests
    if (inFlight.length > 0) {
      const inFlightResults = await Promise.all(inFlight);
      inFlightKeys.forEach((key, index) => {
        result[key] = inFlightResults[index];
      });
    }

    // Fetch remaining keys
    if (needToFetch.length > 0) {
      const fetchedData = await fetcher(needToFetchOriginal);
      const ttl =
        ttlSeconds !== undefined ? ttlSeconds * 1000 : this.defaultTTL;
      const expiryTimestamp = Date.now() + ttl;

      // Cache and add to result
      Object.entries(fetchedData).forEach(([key, value]) => {
        const normalizedKey = key.toLowerCase();
        this.cache[normalizedKey] = {
          value,
          expiryTimestamp,
        };
        result[key] = value;
      });
    }

    return result;
  }

  /**
   * Manually set a cache entry
   */
  set(key: string, value: unknown, ttlSeconds?: number): void {
    const normalizedKey = key.toLowerCase();
    const ttl = ttlSeconds !== undefined ? ttlSeconds * 1000 : this.defaultTTL;

    this.cache[normalizedKey] = {
      value,
      expiryTimestamp: Date.now() + ttl,
    };
  }

  /**
   * Check if a key exists in cache and is not expired
   */
  has(key: string): boolean {
    const normalizedKey = key.toLowerCase();
    if (normalizedKey in this.cache) {
      const entry = this.cache[normalizedKey];
      if (Date.now() < entry.expiryTimestamp) {
        return true;
      } else {
        delete this.cache[normalizedKey];
      }
    }
    return false;
  }

  /**
   * Get a value from cache without fetching (returns undefined if not cached)
   */
  peek<T = unknown>(key: string): T | undefined {
    const normalizedKey = key.toLowerCase();
    if (normalizedKey in this.cache) {
      const entry = this.cache[normalizedKey];
      if (Date.now() < entry.expiryTimestamp) {
        return entry.value as T;
      } else {
        delete this.cache[normalizedKey];
      }
    }
    return undefined;
  }

  /**
   * Clear a specific key from cache
   */
  delete(key: string): void {
    const normalizedKey = key.toLowerCase();
    delete this.cache[normalizedKey];
    delete this.inFlightRequests[normalizedKey];
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache = {};
    // Note: Don't clear inFlightRequests to avoid breaking ongoing requests
  }

  /**
   * Remove expired entries from cache
   */
  prune(): void {
    const now = Date.now();
    Object.keys(this.cache).forEach((key) => {
      if (this.cache[key].expiryTimestamp <= now) {
        delete this.cache[key];
      }
    });
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const now = Date.now();
    let expired = 0;

    Object.values(this.cache).forEach((entry) => {
      if (entry.expiryTimestamp <= now) {
        expired++;
      }
    });

    return {
      size: Object.keys(this.cache).length,
      keys: Object.keys(this.cache),
      inFlightSize: Object.keys(this.inFlightRequests).length,
      inFlightKeys: Object.keys(this.inFlightRequests),
      expired,
    };
  }
}

// Create the singleton instance
const cacheInstance = new SingletonMemoryCache();

// Make it accessible globally via window (for browser environments)
if (typeof window !== "undefined") {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).SingletonMemoryCache = cacheInstance;
}

// Export the singleton instance
export const cache = cacheInstance;
