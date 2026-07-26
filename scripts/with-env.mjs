#!/usr/bin/env node
/**
 * Runs a command with the same environment Next.js would give it.
 *
 * Next.js prefers `.env.local` over `.env`, but a standalone script run with
 * tsx loads neither. Without this wrapper the seed and index scripts would
 * either find no DATABASE_URL at all, or pick up whichever file happened to
 * be loaded — so they could write to a different database than the one
 * `next dev` reads.
 *
 * Usage: node scripts/with-env.mjs tsx src/backend/db/seed.ts
 */
import { spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

/** Highest precedence first, matching Next.js' loader. */
const ENV_FILES = [".env.local", ".env"];

/**
 * Minimal `.env` parser: `KEY=value`, optional `export` prefix, optional
 * single or double quotes, `#` comments and blank lines. Multi-line values
 * are not supported — none of the project's variables need them.
 */
function parseEnv(contents) {
  const values = {};

  for (const rawLine of contents.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const separator = line.indexOf("=");
    if (separator === -1) continue;

    const key = line.slice(0, separator).replace(/^export\s+/, "").trim();
    if (!key) continue;

    let value = line.slice(separator + 1).trim();

    const quote = value[0];
    if ((quote === '"' || quote === "'") && value.endsWith(quote) && value.length > 1) {
      value = value.slice(1, -1);
    } else {
      // Only strip trailing comments from unquoted values, so a `#` inside an
      // unquoted connection string is not mistaken for one.
      value = value.replace(/\s+#.*$/, "");
    }

    values[key] = value;
  }

  return values;
}

function loadEnvFiles() {
  const loaded = {};

  for (const file of ENV_FILES) {
    const path = resolve(process.cwd(), file);
    if (!existsSync(path)) continue;

    for (const [key, value] of Object.entries(parseEnv(readFileSync(path, "utf8")))) {
      // First file wins: .env.local overrides .env.
      if (!(key in loaded)) loaded[key] = value;
    }
  }

  return loaded;
}

const [command, ...args] = process.argv.slice(2);

if (!command) {
  console.error("Usage: node scripts/with-env.mjs <command> [...args]");
  process.exit(1);
}

const loaded = loadEnvFiles();

if (!loaded.DATABASE_URL && !process.env.DATABASE_URL) {
  console.error(
    `DATABASE_URL is not set. Add it to ${ENV_FILES[0]} (preferred) or ${ENV_FILES[1]}.`
  );
  process.exit(1);
}

// Real environment variables outrank the files, which is how Next.js behaves
// and is what lets CI and Vercel override them.
const child = spawn(command, args, {
  stdio: "inherit",
  env: { ...loaded, ...process.env },
  shell: process.platform === "win32",
});

child.on("error", (error) => {
  console.error(`Failed to run "${command}": ${error.message}`);
  process.exit(1);
});

child.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  else process.exit(code ?? 0);
});
