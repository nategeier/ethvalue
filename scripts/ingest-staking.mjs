// Ingest REAL Ethereum staking-queue flows into the ethvalue DB from Dune.
//   inflow  = ETH deposited to the beacon deposit contract  (entering staking)
//   outflow = ETH withdrawn via consensus-layer withdrawals (leaving staking)
// Uses the Dune Analytics API (custom query, executed + polled). Requires
// DUNE_API_KEY in .env.local. Usage: node scripts/ingest-staking.mjs
import { neon } from "@neondatabase/serverless";
import { readFileSync } from "node:fs";

function env(key) {
  if (process.env[key]) return process.env[key];
  const file = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
  const m = file.match(new RegExp(`^${key}\\s*=\\s*"?([^"\\n]+)"?`, "m"));
  if (!m) throw new Error(`${key} not found in .env.local`);
  return m[1];
}

const DUNE_KEY = env("DUNE_API_KEY");
const sql = neon(env("DATABASE_URL"));

// Reuse a single persistent query id so re-runs don't create duplicates.
const QUERY_ID = 7684218;
const DEPOSIT_CONTRACT = "0x00000000219ab540356cBB839Cbe05303d7705Fa";

const QUERY_SQL = `
WITH deposits AS (
  SELECT date_trunc('day', block_time) AS day, sum(value) / 1e18 AS inflow
  FROM ethereum.traces
  WHERE "to" = ${DEPOSIT_CONTRACT}
    AND success AND value > 0
    AND block_time >= date '2020-11-01'
  GROUP BY 1
),
withdrawals AS (
  SELECT date_trunc('day', block_time) AS day, sum(amount) / 1e9 AS outflow
  FROM ethereum.withdrawals
  WHERE block_time >= date '2023-04-01'
  GROUP BY 1
)
SELECT
  coalesce(d.day, w.day)        AS day,
  coalesce(d.inflow, 0)         AS inflow,
  coalesce(w.outflow, 0)        AS outflow
FROM deposits d
FULL OUTER JOIN withdrawals w ON d.day = w.day
ORDER BY 1
`;

const dune = (path, init) =>
  fetch(`https://api.dune.com/api/v1${path}`, {
    ...init,
    headers: {
      "X-Dune-Api-Key": DUNE_KEY,
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });

async function runDuneQuery() {
  console.log("Updating Dune query…");
  await dune(`/query/${QUERY_ID}`, {
    method: "PATCH",
    body: JSON.stringify({ name: "ethvalue — staking flows", query_sql: QUERY_SQL }),
  });

  console.log("Executing…");
  const exec = await (
    await dune(`/query/${QUERY_ID}/execute`, {
      method: "POST",
      body: JSON.stringify({ performance: "medium" }),
    })
  ).json();
  const id = exec.execution_id;

  // Poll until done.
  for (;;) {
    const st = await (await dune(`/execution/${id}/status`)).json();
    if (st.state === "QUERY_STATE_COMPLETED") break;
    if (st.state === "QUERY_STATE_FAILED") throw new Error("Dune execution failed");
    await new Promise((r) => setTimeout(r, 2500));
  }

  // Page through results.
  const rows = [];
  let offset = 0;
  const limit = 1000;
  for (;;) {
    const res = await (
      await dune(`/execution/${id}/results?limit=${limit}&offset=${offset}`)
    ).json();
    const batch = res.result?.rows ?? [];
    rows.push(...batch);
    if (batch.length < limit) break;
    offset += limit;
  }
  return rows;
}

async function main() {
  const raw = await runDuneQuery();
  const rows = raw
    .map((r) => ({
      day: String(r.day).slice(0, 10),
      inflow: Math.round(Number(r.inflow) || 0),
      outflow: Math.round(Number(r.outflow) || 0),
    }))
    .filter((r) => /^\d{4}-\d{2}-\d{2}$/.test(r.day));
  console.log(`Fetched ${rows.length} days (${rows[0]?.day} → ${rows.at(-1)?.day}).`);

  await sql`TRUNCATE staking_queue`;
  const CHUNK = 1000;
  for (let i = 0; i < rows.length; i += CHUNK) {
    const slice = rows.slice(i, i + CHUNK);
    await sql`
      INSERT INTO staking_queue (day, inflow_eth, outflow_eth)
      SELECT * FROM unnest(
        ${slice.map((r) => r.day)}::date[],
        ${slice.map((r) => r.inflow)}::numeric[],
        ${slice.map((r) => r.outflow)}::numeric[]
      )
      ON CONFLICT (day) DO UPDATE
        SET inflow_eth = EXCLUDED.inflow_eth, outflow_eth = EXCLUDED.outflow_eth
    `;
  }

  const [stats] = await sql`
    SELECT COUNT(*) AS n, MIN(day) AS min, MAX(day) AS max,
           ROUND(AVG(inflow_eth)) AS avg_in, ROUND(AVG(outflow_eth)) AS avg_out,
           MAX(inflow_eth) AS peak_in, MAX(outflow_eth) AS peak_out
    FROM staking_queue
  `;
  console.log("Done:", stats);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
