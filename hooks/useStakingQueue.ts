"use client";

import { useState, useEffect, useCallback } from "react";
import type { StakingFlowPoint, StakingWaitStats, TimeRange } from "@/lib/types";

export function useStakingQueue(range: TimeRange = "1Y") {
  const [points, setPoints] = useState<StakingFlowPoint[]>([]);
  const [waitStats, setWaitStats] = useState<StakingWaitStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPoints = useCallback(async (r: TimeRange) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/staking-queue?range=${r}`);
      if (!res.ok) throw new Error("Failed to fetch staking queue data");
      const data = await res.json();
      setPoints(data.points || []);
      setWaitStats(data.waitStats || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setPoints([]);
      setWaitStats(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPoints(range);
  }, [range, fetchPoints]);

  return { points, waitStats, loading, error, refetch: () => fetchPoints(range) };
}
