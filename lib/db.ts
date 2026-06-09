import { neon } from "@neondatabase/serverless";

/**
 * Shared Neon (Postgres) client for the ethvalue database.
 * Reads DATABASE_URL from the environment (server-side only).
 */
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  // Surfaced at request time rather than build time so the rest of the app
  // (which doesn't need the DB) keeps working without it.
  console.warn("DATABASE_URL is not set — DB-backed charts will fail to load.");
}

export const sql = neon(connectionString ?? "");
