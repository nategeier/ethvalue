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
      SELECT day, entry_queue, exit_queue, entry_wait, exit_wait, staked_percent, apr
      FROM validator_queue
      WHERE day >= CURRENT_DATE - ${rangeConfig.days}::int
      ORDER BY day ASC
    `) as {
      day: string;
      entry_queue: number;
      exit_queue: number;
      entry_wait: number;
      exit_wait: number;
      staked_percent: number | null;
      apr: number | null;
    }[];

    const points = rows.map((r) => ({
      time: Math.floor(new Date(r.day).getTime() / 1000),
      entryQueue: Number(r.entry_queue),
      exitQueue: Number(r.exit_queue),
    }));

    const n = rows.length;
    const last = rows[n - 1];
    const avg = (sel: (r: (typeof rows)[number]) => number) =>
      n ? rows.reduce((s, r) => s + Number(sel(r)), 0) / n : 0;

    const stats = {
      // Real consensus-layer wait times (days), from validatorqueue.com data.
      avgEntryWaitDays: avg((r) => r.entry_wait),
      avgExitWaitDays: avg((r) => r.exit_wait),
      currentEntryWaitDays: last ? Number(last.entry_wait) : 0,
      currentExitWaitDays: last ? Number(last.exit_wait) : 0,
      currentEntryQueue: last ? Number(last.entry_queue) : 0,
      currentExitQueue: last ? Number(last.exit_queue) : 0,
      stakedPercent: last?.staked_percent != null ? Number(last.staked_percent) : null,
      apr: last?.apr != null ? Number(last.apr) : null,
    };

    return NextResponse.json(
      { points, range, count: points.length, stats },
      {
        headers: {
          "Cache-Control": "s-maxage=3600, stale-while-revalidate=7200",
        },
      }
    );
  } catch (error) {
    console.error("validator-queue fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch validator queue data" },
      { status: 500 }
    );
  }
}
