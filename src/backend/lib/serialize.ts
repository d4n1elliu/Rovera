import type { CarDoc, ReservationDoc } from "@/backend/db/schema";
import type { Car, Reservation, ReservationWithCar } from "@/shared/types";

/* ---------------------------------------------------------------------
 * Documents cross into the frontend as plain JSON: ObjectIds become strings
 * and Dates become ISO strings. Server components serialise their props on
 * the way to the browser anyway, so doing it here keeps the shape the UI
 * sees identical whether it came from a server component or an API route.
 * ------------------------------------------------------------------- */

export function toCar(doc: CarDoc): Car {
  return {
    id: doc._id.toHexString(),
    slug: doc.slug,
    make: doc.make,
    model: doc.model,
    year: doc.year,
    bodyType: doc.bodyType,
    fuelType: doc.fuelType,
    transmission: doc.transmission,
    seats: doc.seats,
    pricePerDay: doc.pricePerDay,
    imageUrl: doc.imageUrl,
    mileage: doc.mileage,
    description: doc.description,
    vin: doc.vin,
    available: doc.available,
    locationId: doc.locationId.toHexString(),
    ratingAvg: doc.ratingAvg,
    reviewCount: doc.reviewCount,
    tripCount: doc.tripCount,
  };
}

export function toReservation(doc: ReservationDoc): Reservation {
  return {
    id: doc._id.toHexString(),
    reference: doc.reference,
    carId: doc.carId.toHexString(),
    userId: doc.userId.toHexString(),
    pickupLocationId: doc.pickupLocationId.toHexString(),
    dropoffLocationId: doc.dropoffLocationId.toHexString(),
    pickupAt: doc.pickupAt.toISOString(),
    returnAt: doc.returnAt.toISOString(),
    driverAge: doc.driverAge,
    days: doc.days,
    baseTotal: doc.baseTotal,
    youngDriverFee: doc.youngDriverFee,
    discount: doc.discount,
    totalPrice: doc.totalPrice,
    currency: doc.currency,
    promoCodeId: doc.promoCodeId ? doc.promoCodeId.toHexString() : null,
    status: doc.status,
    cancelledAt: doc.cancelledAt ? doc.cancelledAt.toISOString() : null,
    createdAt: doc.createdAt.toISOString(),
  };
}

/** A reservation with its car joined in, as the rentals list renders it. */
export function toReservationWithCar(
  doc: ReservationDoc,
  car: CarDoc
): ReservationWithCar {
  return { ...toReservation(doc), car: toCar(car) };
}
