"use client";

import { useState, useEffect, useCallback } from "react";
import type { TimeRange } from "@/lib/types";

export interface RatioPoint {
  time:      number;
  ratio:     number;  // ETH_MC / BTC_MC — 1.0 = flippening achieved
  pct:       number;  // ratio × 100
  ethClose:  number;
  btcClose:  number;
  pricePair: number;  // ETH/BTC price ratio
}

export interface BtcPrice {
  price:           number;
  high24h:         number;
  low24h:          number;
  volume24h:       number;
  change24h:       number;
  changePercent24h: number;
  lastUpdated:     string;
}

export function useBtcPrice(refreshInterval = 30000) {
  const [btc, setBtc]       = useState<BtcPrice | null>(null);
  const [loading, setLoading] = useState(true);

  const fetch_ = useCallback(async () => {
    try {
      const res = await fetch("/api/btc-price");
      if (res.ok) setBtc(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch_();
    const id = setInterval(fetch_, refreshInterval);
    return () => clearInterval(id);
  }, [fetch_, refreshInterval]);

  return { btc, loading };
}

export function useFlippeningCandles(range: TimeRange = "5Y") {
  const [series,  setSeries]  = useState<RatioPoint[]>([]);
  const [peak,    setPeak]    = useState(0);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  const load = useCallback(async (r: TimeRange) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/flippening-candles?range=${r}`);
      if (!res.ok) throw new Error("fetch failed");
      const data = await res.json();
      setSeries(data.series ?? []);
      setPeak(data.peak ?? 0);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
      setSeries([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(range); }, [range, load]);

  return { series, peak, loading, error, refetch: () => load(range) };
}
