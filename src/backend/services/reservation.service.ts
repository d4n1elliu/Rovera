import "server-only";
import { carRepository } from "@/backend/repositories/car.repository";
import { reservationRepository } from "@/backend/repositories/reservation.repository";
import { toReservation, toReservationWithCar } from "@/backend/lib/serialize";
import { reservationSchema } from "@/shared/schemas/reservation.schema";
import { quoteRental } from "@/shared/lib/pricing";

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
    car._id,
    input.pickupDate,
    input.returnDate
  );
  if (overlaps) throw new Error("Car is already booked for those dates");

  const reservation = await reservationRepository.create({
    carId: car._id,
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

  return toReservation(reservation);
}

export async function getRentalHistory(email: string) {
  const history = await reservationRepository.findByUserEmail(email);
  return history.map(({ reservation, car }) => toReservationWithCar(reservation, car));
}
