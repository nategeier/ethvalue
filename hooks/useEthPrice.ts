"use client";

import { useState, useEffect, useCallback } from "react";
import type { EthPrice } from "@/lib/types";

export function useEthPrice(refreshInterval = 30000) {
  const [price, setPrice] = useState<EthPrice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastTick, setLastTick] = useState<"up" | "down" | null>(null);

  const fetchPrice = useCallback(async () => {
    try {
      const res = await fetch("/api/eth-price");
      if (!res.ok) throw new Error("Failed to fetch price");
      const data: EthPrice = await res.json();

      setPrice((prev) => {
        if (prev) {
          setLastTick(data.usd > prev.usd ? "up" : "down");
        }
        return data;
      });
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPrice();
    const interval = setInterval(fetchPrice, refreshInterval);
    return () => clearInterval(interval);
  }, [fetchPrice, refreshInterval]);

  // Clear tick animation after a moment
  useEffect(() => {
    if (lastTick) {
      const timer = setTimeout(() => setLastTick(null), 800);
      return () => clearTimeout(timer);
    }
  }, [lastTick]);

  return { price, loading, error, lastTick, refetch: fetchPrice };
}
