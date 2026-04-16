import { NextResponse } from "next/server";

const BASE = "https://api.exchange.coinbase.com";

export const revalidate = 30;

export async function GET() {
  try {
    const [ticker, stats] = await Promise.all([
      fetch(`${BASE}/products/BTC-USD/ticker`, { next: { revalidate: 30 } }),
      fetch(`${BASE}/products/BTC-USD/stats`,  { next: { revalidate: 60 } }),
    ]);

    if (!ticker.ok || !stats.ok) throw new Error("Failed to fetch BTC data");

    const [tData, sData] = await Promise.all([ticker.json(), stats.json()]);

    const price  = parseFloat(tData.price);
    const open   = parseFloat(sData.open);

    return NextResponse.json({
      price,
      high24h:      parseFloat(sData.high),
      low24h:       parseFloat(sData.low),
      volume24h:    parseFloat(sData.volume),
      change24h:    price - open,
      changePercent24h: ((price - open) / open) * 100,
      lastUpdated:  new Date().toISOString(),
    }, { headers: { "Cache-Control": "s-maxage=30, stale-while-revalidate=60" } });
  } catch (err) {
    console.error("BTC price error:", err);
    return NextResponse.json({ error: "Failed to fetch BTC price" }, { status: 500 });
  }
}
