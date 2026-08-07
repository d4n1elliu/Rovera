import "server-only";
import { recomputeCarAggregates } from "@/backend/db/aggregates";
import { reviewRepository, type SubmitOutcome } from "@/backend/repositories/review.repository";
import { reviewSchema } from "@/shared/schemas/review.schema";

/** Validates and records a review, then refreshes the denormalised stars the
 *  fleet grid sorts and displays by. */
export async function submitReview(
  reservationId: string,
  userId: string,
  rawInput: unknown
): Promise<SubmitOutcome> {
  const input = reviewSchema.parse(rawInput);

  const outcome = await reviewRepository.submitForOwnTrip({
    reservationId,
    userId,
    rating: input.rating,
    comment: input.comment?.length ? input.comment : null,
  });

  if (outcome === "created") await recomputeCarAggregates();
  return outcome;
}
