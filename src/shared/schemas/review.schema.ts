import { z } from "zod";
import { MAX_REVIEW_RATING, MIN_REVIEW_RATING } from "@/shared/constants";

export const reviewSchema = z.object({
  rating: z.coerce
    .number()
    .int("Rate in whole stars")
    .min(MIN_REVIEW_RATING, `Rating must be at least ${MIN_REVIEW_RATING}`)
    .max(MAX_REVIEW_RATING, `Rating must be at most ${MAX_REVIEW_RATING}`),
  comment: z.string().trim().max(500, "Keep the comment under 500 characters").optional(),
});

export type ReviewInput = z.infer<typeof reviewSchema>;
