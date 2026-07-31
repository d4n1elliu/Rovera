import "server-only";
import { carRepository } from "@/backend/repositories/car.repository";
import { reservationRepository } from "@/backend/repositories/reservation.repository";
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

  const quote = quoteRental({
    pricePerDay: car.pricePerDay,
    pickupAt: input.pickupDate,
    returnAt: input.returnDate,
    driverAge: input.driverAge,
    promoCode: input.promoCode,
  });

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
    // The booking form does not collect branches yet, so a rental starts and
    // ends where the car lives. The search widget's locations replace this
    // once that path is wired up.
    pickupLocationId: car.locationId,
    dropoffLocationId: car.locationId,
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

export async function getRentalHistory(email: string) {
  const history = await reservationRepository.findByUserEmail(email);
  return history.map(({ reservation, car }) => toReservationWithCar(reservation, car));
}
