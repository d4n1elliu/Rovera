import { MAX_RENTAL_DAYS, MIN_RENTAL_HOURS } from "@/shared/constants";
import { exactHoursBetween } from "@/shared/lib/datetime";
import { billableDays } from "@/shared/lib/pricing";

export type RentalWindowErrorCode =
  | "incomplete"
  | "past"
  | "order"
  | "too-short"
  | "too-long";

export interface RentalWindowError {
  code: RentalWindowErrorCode;
  message: string;
}

/** All pickup/return window validation, shared by the search widget,
 *  reservation form, and server so they reject identically.
 *
 *  `notBefore` is caller-supplied: compare against now for time inputs, or
 *  the start of today for date-only inputs (else same-day bookings break
 *  after midnight). */
export function validateRentalWindow(
  pickupAt: Date,
  returnAt: Date,
  notBefore: Date
): RentalWindowError | null {
  if (Number.isNaN(pickupAt.getTime()) || Number.isNaN(returnAt.getTime())) {
    return { code: "incomplete", message: "Choose your pickup and return dates" };
  }

  if (pickupAt.getTime() < notBefore.getTime()) {
    return { code: "past", message: "Pickup cannot be in the past" };
  }

  if (returnAt.getTime() <= pickupAt.getTime()) {
    return { code: "order", message: "Return must be after pickup" };
  }

  if (exactHoursBetween(pickupAt, returnAt) < MIN_RENTAL_HOURS) {
    return {
      code: "too-short",
      message: `Rentals must be at least ${MIN_RENTAL_HOURS} hours`,
    };
  }

  if (billableDays(pickupAt, returnAt) > MAX_RENTAL_DAYS) {
    return {
      code: "too-long",
      message: `Rentals are limited to ${MAX_RENTAL_DAYS} days`,
    };
  }

  return null;
}
