// Ingest REAL Ethereum validator-queue data into the ethvalue DB.
// Source: validatorqueue.com's open dataset (etheralpha/validatorqueue-com),
// the same consensus-layer entry/exit queue + wait times shown on the site.
// Public JSON, no API key. Usage: node scripts/ingest-validator-queue.mjs
import { neon } from "@neondatabase/serverless";
import { readFileSync } from "node:fs";

function env(key) {
  if (process.env[key]) return process.env[key];
  const file = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
  const m = file.match(new RegExp(`^${key}\\s*=\\s*"?([^"\\n]+)"?`, "m"));
  if (!m) throw new Error(`${key} not found in .env.local`);
  return m[1];
}

const sql = neon(env("DATABASE_URL"));
const SOURCE =
  "https://raw.githubusercontent.com/etheralpha/validatorqueue-com/main/historical_data.json";

const num = (v) => (v == null || v === "" ? null : Number(v));

async function main() {
  console.log("Fetching validator-queue history from validatorqueue.com dataset…");
  const res = await fetch(SOURCE);
  if (!res.ok) throw new Error(`Source ${res.status}`);
  const data = await res.json();

  const rows = data
    .filter((r) => /^\d{4}-\d{2}-\d{2}$/.test(r.date))
    .map((r) => ({
      day: r.date,
      validators: num(r.validators),
      entry_queue: num(r.entry_queue) ?? 0,
      exit_queue: num(r.exit_queue) ?? 0,
      entry_wait: num(r.entry_wait) ?? 0,
      exit_wait: num(r.exit_wait) ?? 0,
      staked_percent: num(r.staked_percent),
      apr: num(r.apr),
    }));
  console.log(`Fetched ${rows.length} days (${rows[0]?.day} → ${rows.at(-1)?.day}).`);

  const CHUNK = 1000;
  for (let i = 0; i < rows.length; i += CHUNK) {
    const s = rows.slice(i, i + CHUNK);
    await sql`
      INSERT INTO validator_queue
        (day, validators, entry_queue, exit_queue, entry_wait, exit_wait, staked_percent, apr)
      SELECT * FROM unnest(
        ${s.map((r) => r.day)}::date[],
        ${s.map((r) => r.validators)}::int[],
        ${s.map((r) => r.entry_queue)}::numeric[],
        ${s.map((r) => r.exit_queue)}::numeric[],
        ${s.map((r) => r.entry_wait)}::numeric[],
        ${s.map((r) => r.exit_wait)}::numeric[],
        ${s.map((r) => r.staked_percent)}::numeric[],
        ${s.map((r) => r.apr)}::numeric[]
      )
      ON CONFLICT (day) DO UPDATE SET
        validators = EXCLUDED.validators,
        entry_queue = EXCLUDED.entry_queue,
        exit_queue = EXCLUDED.exit_queue,
        entry_wait = EXCLUDED.entry_wait,
        exit_wait = EXCLUDED.exit_wait,
        staked_percent = EXCLUDED.staked_percent,
        apr = EXCLUDED.apr
    `;
  }

  const [stats] = await sql`
    SELECT COUNT(*) AS n, MIN(day) AS min, MAX(day) AS max,
           MAX(entry_queue) AS peak_entry, MAX(exit_queue) AS peak_exit
    FROM validator_queue
  `;
  const [latest] = await sql`
    SELECT entry_queue, entry_wait, exit_queue, exit_wait, staked_percent, apr
    FROM validator_queue ORDER BY day DESC LIMIT 1
  `;
  console.log("Done:", stats);
  console.log("Latest:", latest);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
