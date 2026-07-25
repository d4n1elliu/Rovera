import { YOUNG_DRIVER_AGE, YOUNG_DRIVER_FEE_PER_DAY } from "@/shared/constants";
import { hoursBetween } from "@/shared/lib/datetime";

export interface QuoteInput {
  pricePerDay: number;
  pickupAt: Date;
  returnAt: Date;
  driverAge: number;
}

export interface Quote {
  /** Billable days; part-days are charged as a full day, minimum one. */
  days: number;
  baseTotal: number;
  youngDriverFee: number;
  total: number;
}

/** Billable days for a rental scheduled by the hour. */
export function billableDays(pickupAt: Date, returnAt: Date) {
  return Math.max(1, Math.ceil(hoursBetween(pickupAt, returnAt) / 24));
}

export function isYoungDriver(driverAge: number) {
  return driverAge < YOUNG_DRIVER_AGE;
}

/** Single source of truth for what a rental costs, shared by search results
 *  and the reservation flow so quoted and charged totals cannot diverge. */
export function quoteRental({ pricePerDay, pickupAt, returnAt, driverAge }: QuoteInput): Quote {
  const days = billableDays(pickupAt, returnAt);
  const baseTotal = days * pricePerDay;
  const youngDriverFee = isYoungDriver(driverAge) ? days * YOUNG_DRIVER_FEE_PER_DAY : 0;

  return {
    days,
    baseTotal,
    youngDriverFee,
    total: baseTotal + youngDriverFee,
  };
}
