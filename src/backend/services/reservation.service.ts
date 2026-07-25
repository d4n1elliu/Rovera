import "server-only";
import { carRepository } from "@/backend/repositories/car.repository";
import { reservationRepository } from "@/backend/repositories/reservation.repository";
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
    totalPrice: quote.total,
  });
}

export async function getRentalHistory(email: string) {
  return reservationRepository.findByCustomerEmail(email);
}
