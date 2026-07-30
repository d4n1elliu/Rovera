import { z } from "zod";
import {
  BODY_TYPES,
  CAR_SORTS,
  DEFAULT_CAR_SORT,
  DEFAULT_PAGE_SIZE,
  FUEL_TYPES,
  MAX_PAGE_SIZE,
} from "@/shared/constants";

export const carFiltersSchema = z.object({
  bodyType: z.enum(BODY_TYPES).optional(),
  fuelType: z.enum(FUEL_TYPES).optional(),
  minPrice: z.coerce.number().nonnegative().optional(),
  maxPrice: z.coerce.number().positive().optional(),
  query: z.string().trim().max(100).optional(),
});

export type CarFiltersInput = z.infer<typeof carFiltersSchema>;

/** How the fleet list is ordered and paged. Kept separate from the filters
 *  because these do not change *which* cars match, only their order and
 *  which slice is returned. */
export const carListingSchema = z.object({
  /** The sort select renders "Recommended" as an empty value, so treat "" as
   *  the default rather than as an invalid sort. */
  sort: z
    .preprocess(
      (value) => (value === "" || value == null ? undefined : value),
      z.enum(CAR_SORTS).optional().catch(undefined)
    )
    .transform((value) => value ?? DEFAULT_CAR_SORT),
  /** 1-based. A page past the end yields an empty list rather than an error,
   *  which is what a stale bookmark should do. */
  page: z.coerce.number().int().min(1).catch(1),
  pageSize: z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).catch(DEFAULT_PAGE_SIZE),
});

export type CarListingInput = z.infer<typeof carListingSchema>;

/** Filters plus ordering, as the fleet list and the API both need them. */
export const carQuerySchema = carFiltersSchema.merge(carListingSchema);

export type CarQueryInput = z.infer<typeof carQuerySchema>;
