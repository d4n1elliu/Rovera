import "server-only";
import { carRepository } from "@/backend/repositories/car.repository";
import { locationRepository } from "@/backend/repositories/location.repository";
import {
  promoCodeRepository,
  toPromotion,
} from "@/backend/repositories/promo-code.repository";
import { paymentRepository } from "@/backend/repositories/payment.repository";
import { reservationRepository } from "@/backend/repositories/reservation.repository";
import { refundReservationPayment } from "@/backend/services/payment.service";
import { toReservation, toReservationWithCar } from "@/backend/lib/serialize";
import { buildBookingConfirmation } from "@/backend/lib/email/booking-confirmation";
import { sendEmail } from "@/backend/lib/email/client";
import { reservationSchema } from "@/shared/schemas/reservation.schema";
import { quoteRental } from "@/shared/lib/pricing";
import type { Reservation } from "@/shared/types";

export async function createReservation(rawInput: unknown) {
  const input = reservationSchema.parse(rawInput);

  const car = await carRepository.findById(input.carId);
  if (!car) throw new Error("Car not found");

  /* The database decides what a code is worth; an unknown or lapsed code
   * quotes as no discount rather than failing the booking. */
  const promoRow = input.promoCode
    ? await promoCodeRepository.findUsableByCode(input.promoCode)
    : null;

  const quote = quoteRental({
    pricePerDay: car.pricePerDay,
    pickupAt: input.pickupDate,
    returnAt: input.returnDate,
    driverAge: input.driverAge,
    promotion: promoRow ? toPromotion(promoRow) : null,
  });

  /* Chosen branches, resolved against the locations table; a missing or
   * retired branch falls back to the car's own rather than failing. */
  const [pickup, dropoff] = await Promise.all([
    input.pickupLocation ? locationRepository.findActiveByName(input.pickupLocation) : null,
    input.dropoffLocation ? locationRepository.findActiveByName(input.dropoffLocation) : null,
  ]);

  const overlaps = await reservationRepository.hasOverlap(
    car.id,
    input.pickupDate,
    input.returnDate
  );
  if (overlaps) throw new Error("Car is already booked for those dates");

  const reservation = await reservationRepository.create({
    carId: car.id,
    user: {
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email,
      phone: input.phone,
    },
    pickupLocationId: pickup?.id ?? car.locationId,
    dropoffLocationId: dropoff?.id ?? pickup?.id ?? car.locationId,
    pickupAt: input.pickupDate,
    returnAt: input.returnDate,
    driverAge: input.driverAge,
    // The whole quote is persisted, not just the total, so the breakdown
    // shown at checkout is the one on the booking record.
    days: quote.days,
    baseTotal: quote.baseTotal,
    youngDriverFee: quote.youngDriverFee,
    discount: quote.discount,
    totalPrice: quote.total,
    // Linked only when the promotion actually discounted this booking.
    promoCodeId: quote.promotion && promoRow ? promoRow.id : null,
  });

  /* Sent after the booking is committed, and deliberately not inside the
   * transaction: an email cannot be rolled back, so a message promising a
   * booking that was then rolled back would be worse than no message.
   *
   * sendEmail never throws — the booking is already durable, and a provider
   * outage is not a reason to tell a renter their reservation failed. The
   * outcome is returned instead, so the confirmation screen can say what
   * actually happened rather than promising an email that may not exist. */
  const delivery = await sendEmail(
    buildBookingConfirmation({
      reservation,
      car,
      firstName: input.firstName,
      to: input.email,
    })
  );

  return { ...toReservation(reservation), emailSent: delivery.sent };
}

/** A created booking, plus whether its confirmation email actually went out. */
export type CreatedReservation = Reservation & { emailSent: boolean };

export type CancelResult =
  | { ok: true; refund: "refunded" | "none" }
  | { ok: false; reason: "not-cancellable" | "refund-failed" };

/** Cancels the signed-in renter's booking, refunding first when money was
 *  taken — a refund that fails must block the cancellation, never trail it. */
export async function cancelReservation(
  reservationId: string,
  userId: string
): Promise<CancelResult> {
  // Eligibility before money moves: refunding a booking that then turns out
  // non-cancellable would hand the refund out and keep the booking live.
  const owned = await reservationRepository.findOwned(reservationId, userId);
  const cancellable =
    owned &&
    (owned.status === "pending" || owned.status === "confirmed") &&
    owned.pickupAt.getTime() > Date.now();
  if (!cancellable) return { ok: false, reason: "not-cancellable" };

  const payment = await paymentRepository.findForReservation(reservationId);
  if (payment?.status === "succeeded") {
    const refund = await refundReservationPayment(reservationId).catch(() => "unavailable" as const);
    if (refund !== "refunded") return { ok: false, reason: "refund-failed" };
  }

  const cancelled = await reservationRepository.cancelOwned(reservationId, userId);
  if (!cancelled) return { ok: false, reason: "not-cancellable" };

  return { ok: true, refund: payment?.status === "succeeded" ? "refunded" : "none" };
}

export async function getRentalHistory(email: string) {
  const history = await reservationRepository.findByUserEmail(email);
  return history.map(({ reservation, car }) => toReservationWithCar(reservation, car));
}
