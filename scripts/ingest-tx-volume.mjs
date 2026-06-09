// Ingest REAL Ethereum daily transaction counts into the ethvalue DB.
// Source: Coin Metrics community API (free, no key) — metric TxCnt.
// Usage: node scripts/ingest-tx-volume.mjs
import { neon } from "@neondatabase/serverless";
import { readFileSync } from "node:fs";

function loadDatabaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  const env = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
  const m = env.match(/^DATABASE_URL\s*=\s*"?([^"\n]+)"?/m);
  if (!m) throw new Error("DATABASE_URL not found in .env.local");
  return m[1];
}

const sql = neon(loadDatabaseUrl());

const BASE =
  "https://community-api.coinmetrics.io/v4/timeseries/asset-metrics" +
  "?assets=eth&metrics=TxCnt&frequency=1d&page_size=10000&start_time=2015-07-30";

async function fetchAll() {
  const rows = [];
  let url = BASE;
  while (url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Coin Metrics ${res.status}`);
    const json = await res.json();
    for (const d of json.data) {
      if (d.TxCnt == null) continue;
      rows.push({ day: d.time.slice(0, 10), count: Math.round(Number(d.TxCnt)) });
    }
    url = json.next_page_url || null;
  }
  return rows;
}

async function main() {
  console.log("Fetching ETH daily tx count from Coin Metrics…");
  const rows = await fetchAll();
  console.log(`Fetched ${rows.length} days (${rows[0]?.day} → ${rows.at(-1)?.day}).`);

  // Replace the seeded data with real values.
  await sql`TRUNCATE tx_volume`;

  // Insert in chunks to keep each statement small.
  const CHUNK = 1000;
  for (let i = 0; i < rows.length; i += CHUNK) {
    const slice = rows.slice(i, i + CHUNK);
    const days = slice.map((r) => r.day);
    const counts = slice.map((r) => r.count);
    await sql`
      INSERT INTO tx_volume (day, tx_count)
      SELECT * FROM unnest(${days}::date[], ${counts}::int[])
      ON CONFLICT (day) DO UPDATE SET tx_count = EXCLUDED.tx_count
    `;
  }

  const [stats] = await sql`
    SELECT COUNT(*) AS n, MIN(day) AS min, MAX(day) AS max,
           ROUND(AVG(tx_count)) AS avg, MAX(tx_count) AS peak
    FROM tx_volume
  `;
  console.log("Done:", stats);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
