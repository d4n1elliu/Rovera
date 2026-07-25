import { z } from "zod";
import { carFiltersSchema, type CarFiltersInput } from "@/shared/schemas/car.schema";
import {
  DEFAULT_DRIVER_AGE,
  DEFAULT_PICKUP_TIME,
  DEFAULT_RETURN_TIME,
  LOCATIONS,
  MAX_DRIVER_AGE,
  MIN_DRIVER_AGE,
  type Location,
} from "@/shared/constants";
import { combineDateTime, startOfDay } from "@/shared/lib/datetime";
import { normalisePromoCode } from "@/shared/config/promotions";
import { validateRentalWindow, type RentalWindowError } from "@/shared/lib/rental-rules";

/** A search as the results page understands it, after the URL has been read. */
export interface CarSearch {
  filters: CarFiltersInput;
  pickupLocation: Location | null;
  dropoffLocation: Location | null;
  /** Both null unless a usable window was supplied; availability and per-car
   *  totals are only calculated when they are set. */
  pickupAt: Date | null;
  returnAt: Date | null;
  driverAge: number;
  promoCode: string | null;
  /** Why a supplied window was ignored, so the page can say so instead of
   *  silently showing the whole fleet. */
  windowError: RentalWindowError | null;
}

/** Every field is tolerant: /cars is reachable without a search at all, and a
 *  stale or hand-edited link should degrade to browsing rather than error.
 *  The API keeps the strict carFiltersSchema, which rejects bad input. */
const rawSearchSchema = z.object({
  bodyType: carFiltersSchema.shape.bodyType.catch(undefined),
  fuelType: carFiltersSchema.shape.fuelType.catch(undefined),
  minPrice: carFiltersSchema.shape.minPrice.catch(undefined),
  maxPrice: carFiltersSchema.shape.maxPrice.catch(undefined),
  query: carFiltersSchema.shape.query.catch(undefined),
  pickupLocation: z.enum(LOCATIONS).optional().catch(undefined),
  dropoffLocation: z.enum(LOCATIONS).optional().catch(undefined),
  pickup: z.string().optional().catch(undefined),
  pickupTime: z.string().optional().catch(undefined),
  return: z.string().optional().catch(undefined),
  returnTime: z.string().optional().catch(undefined),
  driverAge: z.coerce
    .number()
    .int()
    .min(MIN_DRIVER_AGE)
    .max(MAX_DRIVER_AGE)
    .catch(DEFAULT_DRIVER_AGE),
  promo: z.string().trim().max(32).optional().catch(undefined),
});

function toInstant(date: string | undefined, time: string | undefined, fallbackTime: string) {
  if (!date) return null;
  const instant = combineDateTime(date, time || fallbackTime);
  return Number.isNaN(instant.getTime()) ? null : instant;
}

/** Read the booking widget's URL parameters into a search. Kept beside the
 *  filter schema so the widget, the results page and the API agree on the
 *  parameter names. */
export function parseCarSearch(raw: unknown): CarSearch {
  const params = rawSearchSchema.parse(raw ?? {});
  const {
    pickupLocation,
    dropoffLocation,
    pickup,
    pickupTime,
    return: ret,
    returnTime,
    driverAge,
    promo,
    ...filters
  } = params;

  const pickupAt = toInstant(pickup, pickupTime, DEFAULT_PICKUP_TIME);
  const returnAt = toInstant(ret, returnTime, DEFAULT_RETURN_TIME);

  // The same rules the widget enforces before submitting, re-checked because a
  // link can be shared, bookmarked, or left to go stale. Dates carry times
  // here, but a search sitting open past its pickup hour is still worth
  // showing, so compare against the start of today rather than the instant.
  const windowError =
    pickupAt && returnAt ? validateRentalWindow(pickupAt, returnAt, startOfDay(new Date())) : null;

  return {
    filters,
    pickupLocation: pickupLocation ?? null,
    dropoffLocation: dropoffLocation ?? null,
    pickupAt: windowError ? null : pickupAt,
    returnAt: windowError ? null : returnAt,
    driverAge,
    promoCode: promo ? normalisePromoCode(promo) : null,
    windowError,
  };
}

/** Rebuild the search as a query string, so links out of the results page
 *  (a car's details, its reservation form) keep the renter's context. */
export function carSearchQuery(raw: Record<string, string | undefined>) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(raw)) {
    if (value) params.set(key, value);
  }
  return params.toString();
}
