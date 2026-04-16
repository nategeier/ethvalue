import { NextRequest, NextResponse } from "next/server";
import { fetchCandles } from "@/lib/coinbase";
import { TIME_RANGES } from "@/lib/types";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const range = searchParams.get("range") || "1Y";

  const rangeConfig = TIME_RANGES.find((r) => r.label === range);
  if (!rangeConfig) {
    return NextResponse.json({ error: "Invalid range" }, { status: 400 });
  }

  try {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - rangeConfig.days);

    const candles = await fetchCandles(startDate, endDate, rangeConfig.granularity);

    return NextResponse.json(
      { candles, range, count: candles.length },
      {
        headers: {
          "Cache-Control":
            range === "1W" || range === "1M"
              ? "s-maxage=300, stale-while-revalidate=600"
              : "s-maxage=3600, stale-while-revalidate=7200",
        },
      }
    );
  } catch (error) {
    console.error("Candle fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch candle data" },
      { status: 500 }
    );
  }
}
