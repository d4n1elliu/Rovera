import { defineConfig } from "drizzle-kit";

/* ---------------------------------------------------------------------
 * drizzle-kit reads this to diff src/backend/db/schema.ts against the
 * migrations already generated, and writes the difference to drizzle/ as
 * plain SQL.
 *
 *   npm run db:generate    schema.ts -> a new numbered migration
 *   npm run db:migrate     apply pending migrations
 *
 * DATABASE_URL is injected by scripts/with-env.mjs, which loads .env.local
 * ahead of .env exactly as Next.js does, so migrations and the running app
 * always target the same database.
 * ------------------------------------------------------------------- */

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/backend/db/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  /* Must match the `casing` passed to drizzle() in src/backend/db/client.ts,
   * or the generated SQL will not match the queries the app sends. */
  casing: "snake_case",
  /* Supabase keeps its own objects in these schemas. Restricting the diff to
   * `public` stops drizzle-kit from proposing to drop anything Supabase owns. */
  schemaFilter: ["public"],
  strict: true,
  verbose: true,
});
