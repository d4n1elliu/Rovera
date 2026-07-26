import { getDb } from "@/backend/db/client";
import {
  COLLECTIONS,
  type CarDoc,
  type LocationDoc,
  type PaymentDoc,
  type PromoCodeDoc,
  type ReservationDoc,
  type ReviewDoc,
  type UserDoc,
} from "@/backend/db/schema";

/* Typed accessors for every collection. Repositories go through these rather
 * than calling db.collection() with a string, so a mistyped name is a compile
 * error and every query is checked against the document type. */

export async function usersCollection() {
  return (await getDb()).collection<UserDoc>(COLLECTIONS.users);
}

export async function locationsCollection() {
  return (await getDb()).collection<LocationDoc>(COLLECTIONS.locations);
}

export async function carsCollection() {
  return (await getDb()).collection<CarDoc>(COLLECTIONS.cars);
}

export async function reservationsCollection() {
  return (await getDb()).collection<ReservationDoc>(COLLECTIONS.reservations);
}

export async function paymentsCollection() {
  return (await getDb()).collection<PaymentDoc>(COLLECTIONS.payments);
}

export async function reviewsCollection() {
  return (await getDb()).collection<ReviewDoc>(COLLECTIONS.reviews);
}

export async function promoCodesCollection() {
  return (await getDb()).collection<PromoCodeDoc>(COLLECTIONS.promoCodes);
}
