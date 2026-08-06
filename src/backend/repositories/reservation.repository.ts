import "server-only";
import { and, desc, eq, gt, inArray, lt } from "drizzle-orm";
import { getDb } from "@/backend/db/client";
import {
  cars,
  reservations,
  users,
  type CarRow,
  type ReservationRow,
} from "@/backend/db/schema";
import { normalizeEmail } from "@/backend/lib/email";
import { generateBookingReference } from "@/backend/lib/reference";
import { redeemPromoCode } from "@/backend/repositories/promo-code.repository";
import { BLOCKING_RESERVATION_STATUSES, DEFAULT_CURRENCY } from "@/shared/constants";

interface CreateReservationData {
  carId: string;
  user: { firstName: string; lastName: string; email: string; phone: string };
  pickupLocationId: string;
  dropoffLocationId: string;
  pickupAt: Date;
  returnAt: Date;
  driverAge: number;
  /** The priced quote, stored in full so a charge can be explained later
   *  without re-running pricing against today's rates. */
  days: number;
  baseTotal: number;
  youngDriverFee: number;
  discount: number;
  totalPrice: number;
  promoCodeId?: string | null;
}

/** The overlap predicate, in one place: two windows overlap when each starts
 *  before the other ends. Only statuses that still hold a car count. */
function overlapping(pickupAt: Date, returnAt: Date) {
  return and(
    inArray(reservations.status, [...BLOCKING_RESERVATION_STATUSES]),
    lt(reservations.pickupAt, returnAt),
    gt(reservations.returnAt, pickupAt)
  );
}

export const reservationRepository = {
  async create(data: CreateReservationData): Promise<ReservationRow> {
    /* One transaction, so a renter is never created without the booking that
     * required them: a failure partway through rolls the account back rather
     * than leaving it orphaned. */
    return getDb().transaction(async (tx) => {
      const now = new Date();

      /* Booking without an account is still allowed, so the renter is upserted
       * by email. Signing up later fills the same row in rather than creating a
       * second one. ON CONFLICT resolves this in a single statement, so two
       * concurrent guest bookings cannot race into duplicate accounts. */
      const [user] = await tx
        .insert(users)
        .values({
          firstName: data.user.firstName,
          lastName: data.user.lastName,
          email: normalizeEmail(data.user.email),
          phone: data.user.phone,
          passwordHash: null,
          emailVerified: null,
          image: null,
          role: "customer",
          createdAt: now,
          updatedAt: now,
        })
        .onConflictDoUpdate({
          target: users.email,
          // Only the phone number is refreshed: an existing renter's name and
          // credentials are theirs, not the booking form's to overwrite.
          set: { phone: data.user.phone, updatedAt: now },
        })
        .returning();

      if (!user) throw new Error("Could not resolve the renter's account");

      /* Redeemed inside this transaction, so the count and the booking that
       * consumed it commit or roll back together. */
      if (data.promoCodeId) {
        const redeemed = await redeemPromoCode(tx, data.promoCodeId);
        if (!redeemed) {
          throw new Error("That promo code is no longer available");
        }
      }

      const [reservation] = await tx
        .insert(reservations)
        .values({
          reference: generateBookingReference(),
          carId: data.carId,
          userId: user.id,
          pickupLocationId: data.pickupLocationId,
          dropoffLocationId: data.dropoffLocationId,
          pickupAt: data.pickupAt,
          returnAt: data.returnAt,
          driverAge: data.driverAge,
          days: data.days,
          baseTotal: data.baseTotal,
          youngDriverFee: data.youngDriverFee,
          discount: data.discount,
          totalPrice: data.totalPrice,
          currency: DEFAULT_CURRENCY,
          promoCodeId: data.promoCodeId ?? null,
          status: "pending",
          cancelledAt: null,
          createdAt: now,
          updatedAt: now,
        })
        .returning();

      return reservation;
    });
  },

  /** A renter's bookings, newest first, each with its car joined in. */
  async findByUserEmail(
    email: string
  ): Promise<{ reservation: ReservationRow; car: CarRow }[]> {
    /* Resolved in one query rather than fetching the renter, their bookings
     * and those bookings' cars separately. The join is inner because a
     * reservation's car is a foreign key that cannot dangle, so there is no
     * missing-car case to defend against. */
    const rows = await getDb()
      .select({ reservation: reservations, car: cars })
      .from(reservations)
      .innerJoin(users, eq(users.id, reservations.userId))
      .innerJoin(cars, eq(cars.id, reservations.carId))
      .where(eq(users.email, normalizeEmail(email)))
      .orderBy(desc(reservations.createdAt));

    return rows;
  },

  async hasOverlap(carId: string, pickupAt: Date, returnAt: Date): Promise<boolean> {
    // Existence is all that matters, so stop at the first match.
    const [held] = await getDb()
      .select({ id: reservations.id })
      .from(reservations)
      .where(and(eq(reservations.carId, carId), overlapping(pickupAt, returnAt)))
      .limit(1);

    return held !== undefined;
  },

  /** Ids of every car held by a live reservation overlapping the window.
   *  One query for the whole fleet, so a search does not cost a round trip
   *  per car the way hasOverlap would.
   *
   *  The fleet query excludes these directly (NOT IN), which keeps availability
   *  inside the paged query rather than filtering a page after the fact —
   *  otherwise pages would come back short. */
  async findBookedCarIds(pickupAt: Date, returnAt: Date): Promise<string[]> {
    // DISTINCT because a car can be held by more than one reservation in the
    // window, and the caller wants each id once.
    const held = await getDb()
      .selectDistinct({ carId: reservations.carId })
      .from(reservations)
      .where(overlapping(pickupAt, returnAt));

    return held.map((row) => row.carId);
  },
};
