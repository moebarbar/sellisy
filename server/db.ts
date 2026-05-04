import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required");
}

// Pool sizing: Neon's free tier allows ~100 connections. Cap our app's share so
// that bursts can't exhaust the database for other services or for the worker
// process. Idle connections are released after 30s to free server-side state.
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: Number(process.env.PG_POOL_MAX ?? 10),
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 10_000,
});

pool.on("error", (err) => {
  console.error("[db] idle client error:", err);
});

export const db = drizzle(pool, { schema });
