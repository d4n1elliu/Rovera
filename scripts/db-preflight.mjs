#!/usr/bin/env node
/**
 * Checks that the database is actually reachable, before anything tries to use
 * it, and explains it in terms of the thing that is usually wrong.
 *
 * This exists because of a real failure: a Vercel build died four hundred
 * milliseconds into `drizzle-kit migrate` and printed nothing but a spinner.
 * The connection string was present and the same string worked at runtime, so
 * the log said nothing that narrowed it down. A build that cannot reach its
 * database should say which host it tried, on which port, and what to do about
 * it.
 *
 * Never prints the password. Everything below is derived from the parts of the
 * URL that are safe to show.
 *
 * Run directly with `npm run db:check`, and automatically ahead of migrations.
 */

const RESET = "\x1b[0m";
const RED = "\x1b[31m";
const YELLOW = "\x1b[33m";
const GREEN = "\x1b[32m";
const DIM = "\x1b[2m";

function fail(message, hints = []) {
  console.error(`${RED}✗ ${message}${RESET}`);
  for (const hint of hints) console.error(`  ${hint}`);
  process.exit(1);
}

const raw = process.env.DATABASE_URL;

if (!raw) {
  fail("DATABASE_URL is not set.", [
    "Locally:  add it to .env.local",
    "On Vercel: Settings → Environment Variables, for every environment that",
    "           builds (Production AND Preview — a branch deploy is a Preview).",
  ]);
}

let url;
try {
  url = new URL(raw);
} catch {
  fail("DATABASE_URL is not a valid URL.", [
    "Expected: postgresql://USER:PASSWORD@HOST:PORT/DATABASE",
    "If the password contains @ : / ? # or %, it must be percent-encoded.",
  ]);
}

const host = url.hostname;
const port = url.port || "5432";
const database = url.pathname.replace(/^\//, "") || "(default)";

/* Supabase's three ways in, which behave very differently and are easy to mix
 * up because the dashboard shows them on adjacent tabs. */
const isPooler = host.includes("pooler.supabase.com");
const isSupabaseDirect = /^db\..*\.supabase\.co$/.test(host);
const mode = isPooler ? (port === "6543" ? "transaction" : "session") : null;

console.log(`${DIM}database preflight${RESET}`);
console.log(`  host      ${host}`);
console.log(`  port      ${port}${mode ? `  ${DIM}(${mode} pooler)${RESET}` : ""}`);
console.log(`  database  ${database}`);

/* The direct connection resolves to an IPv6 address only. Vercel's build
 * containers have no IPv6 route, so this fails to connect in a way that looks
 * like nothing at all — which is exactly the failure this script exists for. */
if (isSupabaseDirect) {
  fail("This is Supabase's DIRECT connection, which is IPv6-only.", [
    "Vercel build containers cannot reach it, so migrations fail with no",
    "useful error. The pooler has IPv4 addresses and works everywhere.",
    "",
    `Use:  ${GREEN}aws-0-<region>.pooler.supabase.com${RESET}`,
    "Find it under Supabase → Connect → Connection pooling.",
  ]);
}

const { default: postgres } = await import("postgres");

const sql = postgres(raw, {
  // Transaction-mode pooling cannot carry named prepared statements between
  // statements, matching what src/backend/db/client.ts does at runtime.
  prepare: mode !== "transaction",
  max: 1,
  connect_timeout: 10,
  idle_timeout: 2,
  onnotice: () => {},
});

try {
  const [row] = await sql`select current_user, version() as version`;
  const server = String(row.version).split(" ").slice(0, 2).join(" ");
  console.log(`  user      ${row.user ?? row.current_user}`);
  console.log(`${GREEN}✓ reachable${RESET} ${DIM}(${server})${RESET}`);
} catch (error) {
  const code = error?.code ?? "";
  const message = error?.message ?? String(error);

  const hints = [];

  if (code === "ENOTFOUND" || code === "EAI_AGAIN") {
    hints.push("The hostname did not resolve. Check it for typos.");
  } else if (code === "ECONNREFUSED") {
    hints.push(`Nothing is listening on ${host}:${port}.`);
    if (isPooler && port !== "6543" && port !== "5432") {
      hints.push("The pooler listens on 6543 (transaction) and 5432 (session).");
    }
  } else if (code === "ENETUNREACH" || code === "EHOSTUNREACH") {
    hints.push("No network route to the host — typically an IPv6-only address");
    hints.push("being reached from an IPv4-only network, such as a CI builder.");
  } else if (code === "ETIMEDOUT" || /timeout/i.test(message)) {
    hints.push("The connection timed out. If the Supabase project has been");
    hints.push("idle it may be paused — open the dashboard to wake it.");
  } else if (code === "28P01" || /password authentication/i.test(message)) {
    hints.push("Password rejected. If it contains @ : / ? # or %, those must");
    hints.push("be percent-encoded inside the URL.");
  } else if (code === "3D000") {
    hints.push(`The database "${database}" does not exist on this server.`);
  }

  hints.push("", `${DIM}${code ? `[${code}] ` : ""}${message}${RESET}`);
  await sql.end({ timeout: 1 }).catch(() => {});
  fail(`Could not connect to ${host}:${port}`, hints);
}

/* Advisory, not fatal: transaction mode hands the connection back after every
 * statement, which is right for serverless queries and wrong for a migration
 * that wants to hold one. Session mode is the same host on 5432. */
if (mode === "transaction") {
  console.log(
    `${YELLOW}!${RESET} transaction pooler (6543). Fine for the app; for migrations,`
  );
  console.log(
    `  session mode — the same host on ${GREEN}5432${RESET} — holds one connection throughout.`
  );
}

await sql.end({ timeout: 5 }).catch(() => {});
