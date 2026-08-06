import "server-only";
import { and, eq, gte, isNull, lte, or, sql } from "drizzle-orm";
import { getDb } from "@/backend/db/client";
import { promoCodes, type PromoCodeRow } from "@/backend/db/schema";
import { normalisePromoCode, type Promotion } from "@/shared/config/promotions";

/* The promo_codes table decides what a code is worth; the static list in
 * shared/config/promotions.ts is only the browser's instant-feedback copy. */

/** Active and inside its validity window. Redemption caps are checked in
 *  `redeemPromoCode`, atomically, not here. */
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
  /** The usable promotion behind a typed code, or null. Exhausted codes still
   *  return — the cap is only enforced at redemption time. */
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

/** Counts one redemption inside the caller's transaction. The guard lives in
 *  the UPDATE, so two concurrent bookings cannot both take the last one. */
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
