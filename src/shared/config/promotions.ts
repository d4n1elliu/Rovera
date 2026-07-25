import { formatPrice } from "@/shared/utils";

export interface Promotion {
  code: string;
  /** Percentage off the rental charge. Mutually exclusive with amountOff. */
  percentOff?: number;
  /** Flat amount off the rental charge. Mutually exclusive with percentOff. */
  amountOff?: number;
  /** Minimum billable days before the promotion applies. */
  minDays?: number;
}

/** Codes are compared in upper case, so define them that way. */
export const PROMOTIONS: readonly Promotion[] = [
  { code: "ROVERA10", percentOff: 10 },
  { code: "FIRSTTRIP", amountOff: 25 },
  { code: "LONGHAUL", percentOff: 20, minDays: 7 },
];

export function normalisePromoCode(input: string) {
  return input.trim().toUpperCase();
}

export function findPromotion(code: string) {
  const normalised = normalisePromoCode(code);
  return PROMOTIONS.find((promotion) => promotion.code === normalised) ?? null;
}

/** Human-readable summary of what a promotion gives, built from its values so
 *  the wording cannot drift from the discount actually applied. */
export function promotionLabel(promotion: Promotion) {
  const saving =
    promotion.percentOff != null
      ? `${promotion.percentOff}% off`
      : `${formatPrice(promotion.amountOff ?? 0)} off`;

  return promotion.minDays
    ? `${saving} rentals of ${promotion.minDays} days or more`
    : `${saving} your rental`;
}

export type PromoStatus =
  | { kind: "empty" }
  | { kind: "invalid" }
  | { kind: "applied"; promotion: Promotion }
  /** A real code whose conditions the current dates do not yet meet. */
  | { kind: "unmet"; promotion: Promotion };

/** Shared by the search widget, the reservation form and pricing, so all three
 *  agree on whether a code counts. */
export function evaluatePromoCode(code: string, days: number): PromoStatus {
  if (!code.trim()) return { kind: "empty" };

  const promotion = findPromotion(code);
  if (!promotion) return { kind: "invalid" };

  if (promotion.minDays != null && days < promotion.minDays) {
    return { kind: "unmet", promotion };
  }
  return { kind: "applied", promotion };
}
