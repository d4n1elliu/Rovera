import { sql } from "drizzle-orm";
import { getDb } from "@/backend/db/client";

/* Deliberately free of `import "server-only"`: the seed and any future
 * maintenance script run as plain Node processes, and `server-only` throws
 * outside a React Server Component. The repository re-exports this for
 * application code. */

interface AggregateRow {
  review_count: number | string;
  trip_count: number | string;
}

/**
 * Recalculate the denormalised review aggregates every car carries, from the
 * reviews and completed reservations that actually exist.
 *
 * The fleet grid and the rating sort read `ratingAvg` / `reviewCount` /
 * `tripCount` directly rather than joining, so they must be refreshed whenever
 * a review lands or a trip completes. Derived in one pass rather than
 * incremented in place, so a missed update cannot leave a car permanently
 * wrong — and a car whose last review was deleted correctly falls back to zero.
 *
 * One statement, inside the database: the join, the fallback to zero for
 * unrated cars, and the write are a single atomic UPDATE, so no partially
 * recomputed state is ever visible to a concurrent reader.
 */
export async function recomputeCarAggregates() {
  const db = getDb();

  const rows = (await db.execute(sql`
    update cars c
       set rating_avg   = coalesce(agg.rating_avg, 0),
           review_count = agg.review_count,
           trip_count   = agg.trip_count
      from (
             select cr.id,
                    -- One decimal place, matching how the card renders it, so
                    -- the stored value and the displayed value cannot disagree.
                    round(avg(rv.rating), 1) as rating_avg,
                    count(rv.id)             as review_count,
                    (
                      select count(*)
                        from reservations rs
                       where rs.car_id = cr.id
                         and rs.status = 'completed'
                    )                        as trip_count
               from cars cr
               -- LEFT so a car with no reviews is still listed, and is reset
               -- to zero rather than left holding a stale average.
               left join reviews rv on rv.car_id = cr.id
              group by cr.id
           ) as agg
     where c.id = agg.id
    returning c.review_count, c.trip_count
  `)) as unknown as AggregateRow[];

  return {
    updated: rows.length,
    /** Cars that now carry at least one review or completed trip. */
    rated: rows.filter(
      (row) => Number(row.review_count) > 0 || Number(row.trip_count) > 0
    ).length,
  };
}
