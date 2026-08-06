import "server-only";
import { and, eq, sql } from "drizzle-orm";
import { getDb } from "@/backend/db/client";
import { payments, reservations, type PaymentRow } from "@/backend/db/schema";

export const paymentRepository = {
  /** The rental payment for a reservation, if one has been started. */
  async findForReservation(reservationId: string): Promise<PaymentRow | null> {
    const [row] = await getDb()
      .select()
      .from(payments)
      .where(and(eq(payments.reservationId, reservationId), eq(payments.kind, "rental")))
      .limit(1);
    return row ?? null;
  },

  /** Records (or refreshes) the pending payment for a checkout session. The
   *  idempotency key keeps one row per reservation however many sessions open. */
  async upsertPending(input: {
    reservationId: string;
    amount: number;
    currency: string;
    stripeSessionId: string;
  }): Promise<PaymentRow> {
    const now = new Date();
    const [row] = await getDb()
      .insert(payments)
      .values({
        reservationId: input.reservationId,
        kind: "rental",
        status: "requires_payment",
        amount: input.amount,
        currency: input.currency,
        refundedAmount: 0,
        stripeIntentId: input.stripeSessionId,
        idempotencyKey: `rental:${input.reservationId}`,
        failureReason: null,
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: payments.idempotencyKey,
        set: { stripeIntentId: input.stripeSessionId, updatedAt: now },
      })
      .returning();
    return row;
  },

  /** Marks the session's payment succeeded and confirms its reservation, in
   *  one transaction. Safe to replay: an already-succeeded payment is a no-op. */
  async markSucceededBySession(stripeSessionId: string): Promise<boolean> {
    return getDb().transaction(async (tx) => {
      const now = new Date();
      const [paid] = await tx
        .update(payments)
        .set({ status: "succeeded", updatedAt: now })
        .where(
          and(
            eq(payments.stripeIntentId, stripeSessionId),
            eq(payments.status, "requires_payment")
          )
        )
        .returning({ reservationId: payments.reservationId });

      if (!paid) return false;

      await tx
        .update(reservations)
        .set({ status: "confirmed", updatedAt: now })
        .where(
          and(eq(reservations.id, paid.reservationId), eq(reservations.status, "pending"))
        );
      return true;
    });
  },

  /** Records a completed refund of the full charge. */
  async markRefunded(paymentId: string): Promise<void> {
    const now = new Date();
    await getDb()
      .update(payments)
      .set({ status: "refunded", refundedAmount: sql`${payments.amount}`, updatedAt: now })
      .where(and(eq(payments.id, paymentId), eq(payments.status, "succeeded")));
  },

  /** Records a failed or expired session so support can see why. */
  async markFailedBySession(stripeSessionId: string, reason: string): Promise<void> {
    await getDb()
      .update(payments)
      .set({ status: "failed", failureReason: reason, updatedAt: new Date() })
      .where(
        and(
          eq(payments.stripeIntentId, stripeSessionId),
          eq(payments.status, "requires_payment")
        )
      );
  },
};
