import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { TIME_RANGES } from "@/lib/types";

export async function GET(request: NextRequest) {
  const range = request.nextUrl.searchParams.get("range") || "1Y";

  const rangeConfig = TIME_RANGES.find((r) => r.label === range);
  if (!rangeConfig) {
    return NextResponse.json({ error: "Invalid range" }, { status: 400 });
  }

  try {
    const rows = (await sql`
      SELECT day, tx_count
      FROM tx_volume
      WHERE day >= CURRENT_DATE - ${rangeConfig.days}::int
      ORDER BY day ASC
    `) as { day: string; tx_count: number }[];

    const points = rows.map((r) => ({
      time: Math.floor(new Date(r.day).getTime() / 1000),
      value: Number(r.tx_count),
    }));

    return NextResponse.json(
      { points, range, count: points.length },
      {
        headers: {
          "Cache-Control": "s-maxage=3600, stale-while-revalidate=7200",
        },
      }
    );
  } catch (error) {
    console.error("tx-volume fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch transaction volume" },
      { status: 500 }
    );
  }
}
