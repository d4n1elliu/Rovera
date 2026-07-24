import "server-only";
import { carRepository } from "@/backend/repositories/car.repository";
import { reservationRepository } from "@/backend/repositories/reservation.repository";
import { reservationSchema } from "@/shared/schemas/reservation.schema";
import { daysBetween } from "@/shared/utils";
import { MAX_RENTAL_DAYS } from "@/shared/constants";

export async function createReservation(rawInput: unknown) {
  const input = reservationSchema.parse(rawInput);

  const car = await carRepository.findById(input.carId);
  if (!car) throw new Error("Car not found");

  const days = daysBetween(input.pickupDate, input.returnDate);
  if (days > MAX_RENTAL_DAYS) throw new Error(`Rentals are limited to ${MAX_RENTAL_DAYS} days`);

  const overlaps = await reservationRepository.hasOverlap(
    input.carId,
    input.pickupDate,
    input.returnDate
  );
  if (overlaps) throw new Error("Car is already booked for those dates");

  return reservationRepository.create({
    carId: input.carId,
    customer: {
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email,
      phone: input.phone,
    },
    pickupDate: input.pickupDate,
    returnDate: input.returnDate,
    totalPrice: days * car.pricePerDay,
  });
}

export async function getRentalHistory(email: string) {
  return reservationRepository.findByCustomerEmail(email);
}
