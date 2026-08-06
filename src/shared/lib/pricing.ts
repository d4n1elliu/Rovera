import { YOUNG_DRIVER_AGE, YOUNG_DRIVER_FEE_PER_DAY } from "@/shared/constants";
import { evaluatePromoCode, type Promotion } from "@/shared/config/promotions";
import { wallClockHoursBetween } from "@/shared/lib/datetime";

export interface QuoteInput {
  pricePerDay: number;
  pickupAt: Date;
  returnAt: Date;
  driverAge: number;
  /** Looked up in the static list — the browser's instant-feedback path. */
  promoCode?: string | null;
  /** DB-resolved promotion; overrides promoCode. null = none, even if the
   *  static list would match. The server always quotes this way. */
  promotion?: Promotion | null;
}

export interface Quote {
  /** Billable days; part-days are charged as a full day, minimum one. */
  days: number;
  baseTotal: number;
  youngDriverFee: number;
  discount: number;
  /** The promotion actually applied, if any. */
  promotion: Promotion | null;
  total: number;
}

function roundMoney(amount: number) {
  return Math.round(amount * 100) / 100;
}

/** Billable days for a rental scheduled by the hour. Wall-clock hours, so a
 *  rental spanning a daylight-saving change bills the nights actually had. */
export function billableDays(pickupAt: Date, returnAt: Date) {
  return Math.max(1, Math.ceil(wallClockHoursBetween(pickupAt, returnAt) / 24));
}

export function isYoungDriver(driverAge: number) {
  return driverAge < YOUNG_DRIVER_AGE;
}

/** Single source of truth for what a rental costs, shared by search results
 *  and the reservation flow so quoted and charged totals cannot diverge. */
export function quoteRental({
  pricePerDay,
  pickupAt,
  returnAt,
  driverAge,
  promoCode,
  promotion: resolved,
}: QuoteInput): Quote {
  const days = billableDays(pickupAt, returnAt);
  const baseTotal = roundMoney(days * pricePerDay);
  const youngDriverFee = isYoungDriver(driverAge) ? days * YOUNG_DRIVER_FEE_PER_DAY : 0;

  // Discounts come off the rental charge only; a resolved promotion still
  // honours minDays. undefined -> static list, null -> none.
  const promotion =
    resolved !== undefined
      ? resolved && (resolved.minDays == null || days >= resolved.minDays)
        ? resolved
        : null
      : (() => {
          const status = evaluatePromoCode(promoCode ?? "", days);
          return status.kind === "applied" ? status.promotion : null;
        })();
  const discount = promotion
    ? roundMoney(
        promotion.percentOff != null
          ? (baseTotal * promotion.percentOff) / 100
          : Math.min(promotion.amountOff ?? 0, baseTotal)
      )
    : 0;

  return {
    days,
    baseTotal,
    youngDriverFee,
    discount,
    promotion,
    total: roundMoney(baseTotal + youngDriverFee - discount),
  };
}
