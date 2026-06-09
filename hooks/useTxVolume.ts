"use client";

import { useState, useEffect, useCallback } from "react";
import type { TxVolumePoint, TimeRange } from "@/lib/types";

export function useTxVolume(range: TimeRange = "1Y") {
  const [points, setPoints] = useState<TxVolumePoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPoints = useCallback(async (r: TimeRange) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/tx-volume?range=${r}`);
      if (!res.ok) throw new Error("Failed to fetch transaction volume");
      const data = await res.json();
      setPoints(data.points || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setPoints([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPoints(range);
  }, [range, fetchPoints]);

  return { points, loading, error, refetch: () => fetchPoints(range) };
}
