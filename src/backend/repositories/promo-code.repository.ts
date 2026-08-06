import "server-only";
import { and, eq, gte, isNull, lte, or, sql } from "drizzle-orm";
import { getDb } from "@/backend/db/client";
import { promoCodes, type PromoCodeRow } from "@/backend/db/schema";
import { normalisePromoCode, type Promotion } from "@/shared/config/promotions";

/* ---------------------------------------------------------------------
 * Promo codes, read from the database.
 *
 * The promo_codes table is the authority on which codes exist and whether
 * they can still be used. The static list in shared/config/promotions.ts is
 * only the browser's copy for instant feedback while typing — the server
 * resolves every quote and booking through here, so retiring a code or
 * capping its redemptions in the table takes effect without a deploy.
 * ------------------------------------------------------------------- */

/** A code that is active and inside its validity window right now. Does not
 *  check redemptions — that is only decided at redemption time, atomically. */
function usableNow(now: Date) {
  return and(
    eq(promoCodes.active, true),
    or(isNull(promoCodes.validFrom), lte(promoCodes.validFrom, now)),
    or(isNull(promoCodes.validTo), gte(promoCodes.validTo, now))
  );
}

/** The row as pricing understands it. */
export function toPromotion(row: PromoCodeRow): Promotion {
  return {
    code: row.code,
    percentOff: row.percentOff ?? undefined,
    amountOff: row.amountOff ?? undefined,
    minDays: row.minDays ?? undefined,
  };
}

export const promoCodeRepository = {
  /**
   * The usable promotion behind a typed code, or null.
   *
   * A code with its redemptions exhausted is still returned here: quoting
   * runs before booking, and between the two someone else may hand a
   * redemption back or use the last one. The hard cap is enforced by
   * `redeem`, at the only moment it can be enforced truthfully.
   */
  async findUsableByCode(code: string): Promise<PromoCodeRow | null> {
    const normalised = normalisePromoCode(code);
    if (!normalised) return null;

    const [row] = await getDb()
      .select()
      .from(promoCodes)
      .where(and(eq(promoCodes.code, normalised), usableNow(new Date())))
      .limit(1);
    return row ?? null;
  },
};

/**
 * Counts one redemption, atomically, inside the caller's transaction.
 *
 * The guard is in the UPDATE itself: the row must still be active, in its
 * window, and under its cap at the instant of the write. Checking first and
 * updating after would let two concurrent bookings both pass the check and
 * oversubscribe the last redemption; here one of them simply matches no row.
 *
 * Returns false when the code can no longer be redeemed — the caller decides
 * whether that fails the booking.
 */
export async function redeemPromoCode(
  tx: Pick<ReturnType<typeof getDb>, "update">,
  promoCodeId: string
): Promise<boolean> {
  const now = new Date();
  const redeemed = await tx
    .update(promoCodes)
    .set({ timesRedeemed: sql`${promoCodes.timesRedeemed} + 1`, updatedAt: now })
    .where(
      and(
        eq(promoCodes.id, promoCodeId),
        usableNow(now),
        or(
          isNull(promoCodes.maxRedemptions),
          sql`${promoCodes.timesRedeemed} < ${promoCodes.maxRedemptions}`
        )
      )
    )
    .returning({ id: promoCodes.id });

  return redeemed.length > 0;
}
