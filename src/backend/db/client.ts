import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@/backend/db/schema";

/* ---------------------------------------------------------------------
 * The database handle.
 *
 * postgres.js owns a connection pool, so exactly one should exist per
 * process. Next.js' dev server re-evaluates modules on every hot reload,
 * which would otherwise open a new pool each time until Postgres refuses
 * connections — hence the global cache, which survives reloads.
 *
 * Construction is deferred until the first query. Importing this module must
 * stay free of side effects: `next build` loads every route module to analyse
 * it, and connecting (or throwing on a missing DATABASE_URL) at import time
 * would make the build depend on a reachable database.
 * ------------------------------------------------------------------- */

export type Database = PostgresJsDatabase<typeof schema>;

const globalForDb = globalThis as unknown as {
  roveraSql?: ReturnType<typeof postgres>;
  roveraDb?: Database;
};

/**
 * Supabase's pooler runs pgBouncer in transaction mode, where a connection is
 * handed back after every statement. Named prepared statements do not survive
 * that, so they have to be off.
 *
 * Detected from the host rather than configured separately, so pointing
 * DATABASE_URL at a local Postgres (which does support them) does not need a
 * second environment variable to keep in step.
 */
function usesTransactionPooler(url: string) {
  return url.includes("pooler.supabase.com") || url.includes("pgbouncer=true");
}

function connect(): { sql: ReturnType<typeof postgres>; db: Database } {
  const url = process.env.DATABASE_URL;

  if (!url) {
    throw new Error(
      "DATABASE_URL is not set. Add it to .env.local (preferred) or .env."
    );
  }

  const sql = postgres(url, {
    prepare: !usesTransactionPooler(url),
    /* Serverless functions each get their own pool, so a large per-instance
     * pool multiplies into Supabase's connection limit rather than helping. */
    max: process.env.NODE_ENV === "production" ? 5 : 10,
    idle_timeout: 20,
    /* Fail fast in development rather than hanging a request when the
     * database is unreachable. */
    connect_timeout: 10,
  });

  const db = drizzle(sql, {
    schema,
    /* Maps camelCase properties to snake_case columns. drizzle.config.ts sets
     * the same option — if the two disagree, generated migrations will not
     * match the queries this client sends. */
    casing: "snake_case",
    logger: process.env.DB_LOGGING === "true",
  });

  return { sql, db };
}

/** The Drizzle handle every repository queries through. */
export function getDb(): Database {
  if (globalForDb.roveraDb) return globalForDb.roveraDb;

  const { sql, db } = connect();

  // Cached in production too: there is no failed-connection case to retry,
  // because postgres.js connects lazily per query and recovers from a dropped
  // connection on its own.
  globalForDb.roveraSql = sql;
  globalForDb.roveraDb = db;

  return db;
}

/**
 * The underlying postgres.js connection, for the handful of places that need
 * raw SQL or an explicit shutdown.
 */
export function getSql() {
  getDb();
  return globalForDb.roveraSql!;
}

/**
 * Closes the pool. Scripts must call this to exit; long-running servers should
 * not, because the pool is meant to outlive any single request.
 */
export async function closeDb() {
  if (!globalForDb.roveraSql) return;
  await globalForDb.roveraSql.end();
  globalForDb.roveraSql = undefined;
  globalForDb.roveraDb = undefined;
}
