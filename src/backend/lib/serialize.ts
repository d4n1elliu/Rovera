import type { CarRow, ReservationRow } from "@/backend/db/schema";
import type { Car, Reservation, ReservationWithCar } from "@/shared/types";

/* ---------------------------------------------------------------------
 * Rows cross into the frontend as plain JSON: Dates become ISO strings.
 * Server components serialise their props on the way to the browser anyway,
 * so doing it here keeps the shape the UI sees identical whether it came
 * from a server component or an API route.
 *
 * Primary keys need no conversion — they are UUID text on both sides. Prices
 * are already numbers by the time they arrive: the `money` type in
 * db/schema.ts converts Postgres' exact numeric to a JS number on the way
 * out.
 *
 * The row types are structurally wider than the JSON ones (they carry
 * createdAt/updatedAt and internal columns), so fields are copied explicitly
 * rather than spread — that way adding a column to the schema cannot
 * accidentally publish it through the API.
 * ------------------------------------------------------------------- */

export function toCar(row: CarRow): Car {
  return {
    id: row.id,
    slug: row.slug,
    make: row.make,
    model: row.model,
    year: row.year,
    bodyType: row.bodyType,
    fuelType: row.fuelType,
    transmission: row.transmission,
    seats: row.seats,
    pricePerDay: row.pricePerDay,
    imageUrl: row.imageUrl,
    mileage: row.mileage,
    description: row.description,
    vin: row.vin,
    available: row.available,
    locationId: row.locationId,
    ratingAvg: row.ratingAvg,
    reviewCount: row.reviewCount,
    tripCount: row.tripCount,
  };
}

export function toReservation(row: ReservationRow): Reservation {
  return {
    id: row.id,
    reference: row.reference,
    carId: row.carId,
    userId: row.userId,
    pickupLocationId: row.pickupLocationId,
    dropoffLocationId: row.dropoffLocationId,
    pickupAt: row.pickupAt.toISOString(),
    returnAt: row.returnAt.toISOString(),
    driverAge: row.driverAge,
    days: row.days,
    baseTotal: row.baseTotal,
    youngDriverFee: row.youngDriverFee,
    discount: row.discount,
    totalPrice: row.totalPrice,
    currency: row.currency,
    promoCodeId: row.promoCodeId,
    status: row.status,
    cancelledAt: row.cancelledAt ? row.cancelledAt.toISOString() : null,
    createdAt: row.createdAt.toISOString(),
  };
}

/** A reservation with its car joined in, as the rentals list renders it. */
export function toReservationWithCar(
  row: ReservationRow,
  car: CarRow
): ReservationWithCar {
  return { ...toReservation(row), car: toCar(car) };
}
