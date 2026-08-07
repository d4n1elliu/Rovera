import "server-only";
import type Stripe from "stripe";
import { getStripe, isStripeConfigured, siteUrl } from "@/backend/lib/payments/stripe";
import { paymentRepository } from "@/backend/repositories/payment.repository";
import { reservationRepository } from "@/backend/repositories/reservation.repository";

export type CheckoutState =
  | { state: "unavailable" }
  | { state: "paid" }
  | { state: "not-payable"; status: string }
  | { state: "ready"; url: string };

/** Opens a Stripe Checkout session for a pending booking. The amount comes
 *  from the reservation row, never from the caller. */
export async function startCheckout(reference: string): Promise<CheckoutState | null> {
  const found = await reservationRepository.findByReference(reference);
  if (!found) return null;
  const { reservation, car } = found;

  const existing = await paymentRepository.findForReservation(reservation.id);
  if (existing?.status === "succeeded") return { state: "paid" };
  if (reservation.status !== "pending") return { state: "not-payable", status: reservation.status };
  if (!isStripeConfigured()) return { state: "unavailable" };

  const base = siteUrl();
  const session = await getStripe().checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: reservation.currency.toLowerCase(),
          unit_amount: Math.round(reservation.totalPrice * 100),
          product_data: {
            name: `${car.year} ${car.make} ${car.model} — ${reservation.days} day rental`,
            description: `Booking ${reservation.reference}`,
          },
        },
      },
    ],
    metadata: { reservationId: reservation.id, reference: reservation.reference },
    success_url: `${base}/confirmation?ref=${encodeURIComponent(reservation.reference)}&paid=1`,
    cancel_url: `${base}/checkout?ref=${encodeURIComponent(reservation.reference)}`,
  });

  await paymentRepository.upsertPending({
    reservationId: reservation.id,
    amount: reservation.totalPrice,
    currency: reservation.currency,
    stripeSessionId: session.id,
  });

  if (!session.url) throw new Error("Stripe did not return a checkout URL");
  return { state: "ready", url: session.url };
}

export type RefundOutcome = "refunded" | "nothing-to-refund" | "unavailable";

/** Refunds a reservation's succeeded payment in full via Stripe. */
export async function refundReservationPayment(reservationId: string): Promise<RefundOutcome> {
  const payment = await paymentRepository.findForReservation(reservationId);
  if (!payment || payment.status !== "succeeded") return "nothing-to-refund";
  if (!isStripeConfigured() || !payment.stripeIntentId) return "unavailable";

  // We store the checkout session id; the refund needs its payment intent.
  const session = await getStripe().checkout.sessions.retrieve(payment.stripeIntentId);
  if (typeof session.payment_intent !== "string") return "unavailable";

  await getStripe().refunds.create({ payment_intent: session.payment_intent });
  await paymentRepository.markRefunded(payment.id);
  return "refunded";
}

/** Applies a verified Stripe event. Replays are no-ops because the payment
 *  row only moves out of requires_payment once. */
export async function handleStripeEvent(event: Stripe.Event): Promise<void> {
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      await paymentRepository.markSucceededBySession(session.id);
      break;
    }
    case "checkout.session.expired": {
      const session = event.data.object;
      await paymentRepository.markFailedBySession(session.id, "checkout session expired");
      break;
    }
    default:
      break;
  }
}
