"use client";

import { useState, useEffect, useCallback } from "react";
import type { CandleData, TimeRange } from "@/lib/types";

export function useCandles(range: TimeRange = "1Y") {
  const [candles, setCandles] = useState<CandleData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCandles = useCallback(async (r: TimeRange) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/eth-candles?range=${r}`);
      if (!res.ok) throw new Error("Failed to fetch candles");
      const data = await res.json();
      setCandles(data.candles || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setCandles([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCandles(range);
  }, [range, fetchCandles]);

  return { candles, loading, error, refetch: () => fetchCandles(range) };
}
