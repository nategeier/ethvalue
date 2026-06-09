"use client";

import { useState, useEffect, useCallback } from "react";
import type { ValidatorQueuePoint, ValidatorQueueStats, TimeRange } from "@/lib/types";

export function useValidatorQueue(range: TimeRange = "1Y") {
  const [points, setPoints] = useState<ValidatorQueuePoint[]>([]);
  const [stats, setStats] = useState<ValidatorQueueStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPoints = useCallback(async (r: TimeRange) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/validator-queue?range=${r}`);
      if (!res.ok) throw new Error("Failed to fetch validator queue data");
      const data = await res.json();
      setPoints(data.points || []);
      setStats(data.stats || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setPoints([]);
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPoints(range);
  }, [range, fetchPoints]);

  return { points, stats, loading, error, refetch: () => fetchPoints(range) };
}
