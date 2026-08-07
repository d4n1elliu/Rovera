import "server-only";
import { sql } from "drizzle-orm";
import { getDb } from "@/backend/db/client";
import { rateLimits } from "@/backend/db/schema";

export interface RateLimitRule {
  /** Requests allowed per window. */
  limit: number;
  windowSeconds: number;
}

export type RateLimitVerdict =
  | { allowed: true }
  | { allowed: false; retryAfterSeconds: number };

/** The caller's IP as Vercel forwards it; "unknown" pools direct hits. */
export function clientIpFrom(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || "unknown";
}

/** Counts one hit against `bucket` for `id`, atomically — the CASE inside the
 *  upsert resets or increments the window so two racing hits cannot both slip. */
export async function rateLimit(
  bucket: string,
  id: string,
  rule: RateLimitRule
): Promise<RateLimitVerdict> {
  const db = getDb();
  const key = `${bucket}:${id}`;

  try {
    const rows = (await db.execute(sql`
      insert into ${rateLimits} (key, window_start, count)
      values (${key}, now(), 1)
      on conflict (key) do update set
        count = case
          when ${rateLimits.windowStart} < now() - make_interval(secs => ${rule.windowSeconds})
            then 1 else ${rateLimits.count} + 1 end,
        window_start = case
          when ${rateLimits.windowStart} < now() - make_interval(secs => ${rule.windowSeconds})
            then now() else ${rateLimits.windowStart} end
      returning count, extract(epoch from window_start + make_interval(secs => ${rule.windowSeconds}) - now())::int as reset_in
    `)) as unknown as { count: number; reset_in: number }[];

    const row = rows[0];
    if (!row || Number(row.count) <= rule.limit) return { allowed: true };
    return { allowed: false, retryAfterSeconds: Math.max(1, Number(row.reset_in)) };
  } catch {
    // Fail open: a limiter outage must not take bookings down with it.
    return { allowed: true };
  }
}

/** Standard headers-and-body shape for a 429. */
export function tooManyRequests(retryAfterSeconds: number) {
  return new Response(
    JSON.stringify({ success: false, error: "Too many requests. Please try again shortly." }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": String(retryAfterSeconds),
      },
    }
  );
}
