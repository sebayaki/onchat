"use client";

import { useState, useEffect, useRef } from "react";
import {
  fetchUserProfilesBulk,
  type FarcasterUserProfile,
} from "@/helpers/farcaster";

export function useFarcasterProfiles(addresses: string[]) {
  const [profiles, setProfiles] = useState<
    Record<string, FarcasterUserProfile | null>
  >({});
  const [loading, setLoading] = useState(false);
  const prevAddressesRef = useRef<string[]>([]);

  useEffect(() => {
    // Only fetch if addresses have changed and are not empty
    const uniqueAddresses = [
      ...new Set(addresses.map((a) => a.toLowerCase())),
    ].filter(Boolean);
    const prevUnique = [
      ...new Set(prevAddressesRef.current.map((a) => a.toLowerCase())),
    ];

    if (
      uniqueAddresses.length === 0 ||
      (uniqueAddresses.length === prevUnique.length &&
        uniqueAddresses.every((a) => prevUnique.includes(a)))
    ) {
      return;
    }

    prevAddressesRef.current = addresses;

    const loadProfiles = async () => {
      setLoading(true);
      try {
        const result = await fetchUserProfilesBulk(uniqueAddresses);
        setProfiles((prev) => ({ ...prev, ...result }));
      } catch (err) {
        console.error("Failed to fetch Farcaster profiles:", err);
      } finally {
        setLoading(false);
      }
    };

    loadProfiles();
  }, [addresses]);

  return { profiles, loading };
}
