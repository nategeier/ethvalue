import { NextRequest, NextResponse } from "next/server";
import { TIME_RANGES } from "@/lib/types";

const BASE = "https://api.exchange.coinbase.com";

// Approximate circulating supplies (kept as constants — close enough for ratio calc)
const ETH_SUPPLY = 120_400_000;
const BTC_SUPPLY =  19_700_000;

interface RawCandle { time: number; open: number; high: number; low: number; close: number; }

async function fetchAllCandles(
  product: string,
  startDate: Date,
  endDate: Date,
  granularity: number
): Promise<RawCandle[]> {
  const all: RawCandle[] = [];
  const windowMs = 300 * granularity * 1000; // max 300 candles per request
  let currentEnd = endDate.getTime();
  const absoluteStart = startDate.getTime();

  while (currentEnd > absoluteStart) {
    const currentStart = Math.max(currentEnd - windowMs, absoluteStart);
    const url = `${BASE}/products/${product}/candles?granularity=${granularity}&start=${new Date(currentStart).toISOString()}&end=${new Date(currentEnd).toISOString()}`;

    try {
      const res = await fetch(url, { next: { revalidate: 3600 } });
      if (!res.ok) break;
      const data: number[][] = await res.json();
      if (!Array.isArray(data) || data.length === 0) break;

      // [time, low, high, open, close, volume]
      all.push(...data.map((c) => ({
        time:  c[0],
        low:   c[1],
        high:  c[2],
        open:  c[3],
        close: c[4],
      })));
    } catch { break; }

    currentEnd = currentStart - granularity * 1000;
    await new Promise((r) => setTimeout(r, 80));
  }

  return all
    .sort((a, b) => a.time - b.time)
    .filter((c, i, arr) => i === 0 || c.time !== arr[i - 1].time);
}

export async function GET(req: NextRequest) {
  const range = req.nextUrl.searchParams.get("range") || "5Y";
  const cfg   = TIME_RANGES.find((r) => r.label === range);
  if (!cfg) return NextResponse.json({ error: "Invalid range" }, { status: 400 });

  try {
    const end   = new Date();
    const start = new Date();
    start.setDate(start.getDate() - cfg.days);

    // Fetch ETH and BTC candles in parallel
    const [ethCandles, btcCandles] = await Promise.all([
      fetchAllCandles("ETH-USD", start, end, cfg.granularity),
      fetchAllCandles("BTC-USD", start, end, cfg.granularity),
    ]);

    // Build a map of BTC close prices keyed by timestamp
    const btcMap = new Map<number, number>();
    btcCandles.forEach((c) => btcMap.set(c.time, c.close));

    // Compute ETH/BTC market-cap ratio for each ETH candle that has a BTC match
    const ratioSeries = ethCandles
      .filter((c) => btcMap.has(c.time))
      .map((c) => {
        const btcClose  = btcMap.get(c.time)!;
        const ethMC     = c.close  * ETH_SUPPLY;
        const btcMC     = btcClose * BTC_SUPPLY;
        const ratio     = ethMC / btcMC; // 1.0 = flippening
        const pricePair = c.close / btcClose; // raw ETH/BTC price ratio
        return {
          time:      c.time,
          ratio,          // ETH_MC / BTC_MC  (target: 1.0)
          pct:       ratio * 100,
          ethClose:  c.close,
          btcClose,
          pricePair,
        };
      });

    const peak = ratioSeries.reduce(
      (max, r) => (r.ratio > max ? r.ratio : max),
      0
    );

    const cacheHeader =
      range === "1W" || range === "1M"
        ? "s-maxage=300, stale-while-revalidate=600"
        : "s-maxage=3600, stale-while-revalidate=7200";

    return NextResponse.json(
      { series: ratioSeries, peak, range, count: ratioSeries.length },
      { headers: { "Cache-Control": cacheHeader } }
    );
  } catch (err) {
    console.error("Flippening candles error:", err);
    return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 });
  }
}
