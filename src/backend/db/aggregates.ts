import { ObjectId } from "mongodb";
import {
  carsCollection,
  reservationsCollection,
  reviewsCollection,
} from "@/backend/db/collections";

/* Deliberately free of `import "server-only"`: the seed and any future
 * maintenance script run as plain Node processes, and `server-only` throws
 * outside a React Server Component. The repository re-exports this for
 * application code. */

/**
 * Recalculate the denormalised review aggregates every car carries, from the
 * reviews and completed reservations that actually exist.
 *
 * The fleet grid and the rating sort read `ratingAvg` / `reviewCount` /
 * `tripCount` directly rather than joining, so they must be refreshed whenever
 * a review lands or a trip completes. Derived in one pass rather than
 * incremented in place, so a missed update cannot leave a car permanently
 * wrong — and a car whose last review was deleted correctly falls back to zero.
 */
export async function recomputeCarAggregates() {
  const [cars, reviews, reservations] = await Promise.all([
    carsCollection(),
    reviewsCollection(),
    reservationsCollection(),
  ]);

  const [ratings, trips] = await Promise.all([
    reviews
      .aggregate<{ _id: ObjectId; ratingAvg: number; reviewCount: number }>([
        { $group: { _id: "$carId", ratingAvg: { $avg: "$rating" }, reviewCount: { $sum: 1 } } },
      ])
      .toArray(),
    reservations
      .aggregate<{ _id: ObjectId; tripCount: number }>([
        { $match: { status: "completed" } },
        { $group: { _id: "$carId", tripCount: { $sum: 1 } } },
      ])
      .toArray(),
  ]);

  const byCar = new Map<string, { ratingAvg: number; reviewCount: number; tripCount: number }>();

  for (const row of ratings) {
    byCar.set(row._id.toHexString(), {
      // One decimal place, matching how the card renders it, so the stored
      // value and the displayed value cannot disagree.
      ratingAvg: Math.round(row.ratingAvg * 10) / 10,
      reviewCount: row.reviewCount,
      tripCount: 0,
    });
  }

  for (const row of trips) {
    const key = row._id.toHexString();
    const existing = byCar.get(key) ?? { ratingAvg: 0, reviewCount: 0, tripCount: 0 };
    byCar.set(key, { ...existing, tripCount: row.tripCount });
  }

  const ids = await cars.find({}, { projection: { _id: 1 } }).toArray();

  const operations = ids.map(({ _id }) => {
    const totals = byCar.get(_id.toHexString()) ?? {
      ratingAvg: 0,
      reviewCount: 0,
      tripCount: 0,
    };
    return { updateOne: { filter: { _id }, update: { $set: totals } } };
  });

  if (operations.length > 0) await cars.bulkWrite(operations);

  return { updated: operations.length, rated: byCar.size };
}
