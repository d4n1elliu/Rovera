import "server-only";
import { and, eq, inArray, lt } from "drizzle-orm";
import { getDb } from "@/backend/db/client";
import { reservations, reviews } from "@/backend/db/schema";

export type SubmitOutcome = "created" | "already-reviewed" | "not-reviewable";

export const reviewRepository = {
  /** Reviews the renter's own finished trip; completing the reservation and
   *  inserting the review commit together. */
  async submitForOwnTrip(input: {
    reservationId: string;
    userId: string;
    rating: number;
    comment: string | null;
  }): Promise<SubmitOutcome> {
    const db = getDb();
    const now = new Date();

    try {
      return await db.transaction(async (tx) => {
        // A trip is finished once its return time has passed; "completed" also
        // covers seeded history. The WHERE carries every eligibility rule.
        const [trip] = await tx
          .update(reservations)
          .set({ status: "completed", updatedAt: now })
          .where(
            and(
              eq(reservations.id, input.reservationId),
              eq(reservations.userId, input.userId),
              inArray(reservations.status, ["confirmed", "completed"]),
              lt(reservations.returnAt, now)
            )
          )
          .returning({ id: reservations.id, carId: reservations.carId });

        if (!trip) return "not-reviewable" as const;

        const [existing] = await tx
          .select({ id: reviews.id })
          .from(reviews)
          .where(eq(reviews.reservationId, trip.id))
          .limit(1);
        if (existing) return "already-reviewed" as const;

        await tx.insert(reviews).values({
          reservationId: trip.id,
          carId: trip.carId,
          userId: input.userId,
          rating: input.rating,
          comment: input.comment,
          createdAt: now,
        });
        return "created" as const;
      });
    } catch (error) {
      // The unique key on reservation_id backstops a race past the pre-check.
      if ((error as { code?: string }).code === "23505") return "already-reviewed";
      throw error;
    }
  },
};
