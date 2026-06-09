import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { TIME_RANGES } from "@/lib/types";

// Beacon-chain churn capacity: validators (and their stake) can only be
// activated / exited at a capped rate per day. We model both the entry and
// exit queues as backlogs that fill with daily flow and drain at this cap.
// Wait time on a given day ≈ remaining backlog ÷ churn capacity per day.
// ~80k ETH/day ≈ ~2,500 validators/day (~11 per epoch). Calibrated to sit
// just above the sustained average daily inflow so the modeled queue stays
// bounded but demand bursts still produce the realistic days-to-weeks waits
// observed on-chain. This is an estimate, not the exact consensus-layer queue.
const CHURN_ETH_PER_DAY = 80_000;

export async function GET(request: NextRequest) {
  const range = request.nextUrl.searchParams.get("range") || "1Y";

  const rangeConfig = TIME_RANGES.find((r) => r.label === range);
  if (!rangeConfig) {
    return NextResponse.json({ error: "Invalid range" }, { status: 400 });
  }

  try {
    // Pull the full history so the queue backlog simulation is accurate, then
    // window the returned points / averaged stats to the requested range.
    const rows = (await sql`
      SELECT day, inflow_eth, outflow_eth
      FROM staking_queue
      ORDER BY day ASC
    `) as { day: string; inflow_eth: number; outflow_eth: number }[];

    const cutoff = Date.now() - rangeConfig.days * 86_400_000;

    let entryBacklog = 0;
    let exitBacklog = 0;
    const points: { time: number; inflow: number; outflow: number }[] = [];
    let entryWaitSum = 0;
    let exitWaitSum = 0;
    let windowDays = 0;
    let currentEntryWait = 0;
    let currentExitWait = 0;

    for (const r of rows) {
      const inflow = Number(r.inflow_eth);
      const outflow = Number(r.outflow_eth);
      const ts = new Date(r.day).getTime();

      // Fill, then drain at the churn cap.
      entryBacklog = Math.max(0, entryBacklog + inflow - CHURN_ETH_PER_DAY);
      exitBacklog = Math.max(0, exitBacklog + outflow - CHURN_ETH_PER_DAY);

      // Days to clear whatever is still queued at this churn rate.
      const entryWait = entryBacklog / CHURN_ETH_PER_DAY;
      const exitWait = exitBacklog / CHURN_ETH_PER_DAY;
      currentEntryWait = entryWait;
      currentExitWait = exitWait;

      if (ts >= cutoff) {
        points.push({
          time: Math.floor(ts / 1000),
          inflow,
          outflow,
        });
        entryWaitSum += entryWait;
        exitWaitSum += exitWait;
        windowDays += 1;
      }
    }

    const waitStats = {
      // Average modeled wait (days) over the selected range.
      avgEntryWaitDays: windowDays ? entryWaitSum / windowDays : 0,
      avgExitWaitDays: windowDays ? exitWaitSum / windowDays : 0,
      // Most recent modeled wait (days).
      currentEntryWaitDays: currentEntryWait,
      currentExitWaitDays: currentExitWait,
    };

    return NextResponse.json(
      { points, range, count: points.length, waitStats },
      {
        headers: {
          "Cache-Control": "s-maxage=3600, stale-while-revalidate=7200",
        },
      }
    );
  } catch (error) {
    console.error("staking-queue fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch staking queue data" },
      { status: 500 }
    );
  }
}
