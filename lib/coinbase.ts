import type { CandleData, EthPrice } from "./types";

const COINBASE_BASE = "https://api.exchange.coinbase.com";

/**
 * Fetch current ETH price in USD and EUR
 */
export async function fetchEthPrice(): Promise<EthPrice> {
  const [usdTicker, eurTicker, usdStats] = await Promise.all([
    fetch(`${COINBASE_BASE}/products/ETH-USD/ticker`, { next: { revalidate: 30 } }),
    fetch(`${COINBASE_BASE}/products/ETH-EUR/ticker`, { next: { revalidate: 30 } }),
    fetch(`${COINBASE_BASE}/products/ETH-USD/stats`, { next: { revalidate: 60 } }),
  ]);

  if (!usdTicker.ok || !eurTicker.ok || !usdStats.ok) {
    throw new Error("Failed to fetch ETH price data");
  }

  const [usdData, eurData, statsData] = await Promise.all([
    usdTicker.json(),
    eurTicker.json(),
    usdStats.json(),
  ]);

  const usdPrice = parseFloat(usdData.price);
  const eurPrice = parseFloat(eurData.price);
  const open24h = parseFloat(statsData.open);
  const change24h = usdPrice - open24h;
  const changePercent24h = ((change24h / open24h) * 100);

  return {
    usd: usdPrice,
    eur: eurPrice,
    change24h,
    changePercent24h,
    high24h: parseFloat(statsData.high),
    low24h: parseFloat(statsData.low),
    volume24h: parseFloat(statsData.volume),
    marketCap: 0, // Not available from Coinbase Exchange API
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Fetch candle data for a given date range, paginating as needed (max 300 per request)
 */
export async function fetchCandles(
  startDate: Date,
  endDate: Date,
  granularity: number = 86400
): Promise<CandleData[]> {
  const allCandles: CandleData[] = [];

  // Coinbase returns max 300 candles per request
  // For daily candles, 300 days = ~10 months, so for 10 years we need ~12 requests
  const maxCandlesPerRequest = 300;
  const windowSize = maxCandlesPerRequest * granularity * 1000; // ms

  let currentEnd = endDate.getTime();
  const absoluteStart = startDate.getTime();

  while (currentEnd > absoluteStart) {
    const currentStart = Math.max(currentEnd - windowSize, absoluteStart);

    const startISO = new Date(currentStart).toISOString();
    const endISO = new Date(currentEnd).toISOString();

    const url = `${COINBASE_BASE}/products/ETH-USD/candles?granularity=${granularity}&start=${startISO}&end=${endISO}`;

    try {
      const response = await fetch(url, { next: { revalidate: 3600 } });
      if (!response.ok) {
        console.error(`Failed to fetch candles: ${response.status}`);
        break;
      }

      const data: number[][] = await response.json();

      if (!Array.isArray(data) || data.length === 0) break;

      // Coinbase returns [time, low, high, open, close, volume]
      const candles: CandleData[] = data.map((c) => ({
        time: c[0],
        low: c[1],
        high: c[2],
        open: c[3],
        close: c[4],
        volume: c[5],
      }));

      allCandles.push(...candles);
    } catch (err) {
      console.error("Error fetching candles:", err);
      break;
    }

    // Move window back
    currentEnd = currentStart - granularity * 1000;

    // Add a small delay to avoid rate limiting
    await new Promise((r) => setTimeout(r, 100));
  }

  // Sort ascending by time and deduplicate
  const sorted = allCandles
    .sort((a, b) => a.time - b.time)
    .filter((c, i, arr) => i === 0 || c.time !== arr[i - 1].time);

  return sorted;
}

/**
 * Format price with commas and decimals
 */
export function formatPrice(price: number, decimals = 2): string {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(price);
}

/**
 * Format large numbers (volume, market cap)
 */
export function formatLargeNumber(num: number): string {
  if (num >= 1e12) return `${(num / 1e12).toFixed(2)}T`;
  if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
  if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
  if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K`;
  return num.toFixed(2);
}
