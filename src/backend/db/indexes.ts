import type { IndexDescription } from "mongodb";
import { COLLECTIONS } from "@/backend/db/schema";

/* ---------------------------------------------------------------------
 * Index definitions.
 *
 * Two jobs: the unique indexes are the model's constraints (there is no
 * other layer enforcing them), and the compound indexes keep availability
 * lookups from collection-scanning as the reservation history grows.
 *
 * Sparse unique indexes are used where the field is nullable — without
 * `sparse`, a second document with a null value would collide with the first.
 * ------------------------------------------------------------------- */

export const INDEXES: Record<string, IndexDescription[]> = {
  [COLLECTIONS.users]: [{ key: { email: 1 }, unique: true, name: "email_unique" }],

  [COLLECTIONS.locations]: [
    { key: { slug: 1 }, unique: true, name: "slug_unique" },
    { key: { name: 1 }, unique: true, name: "name_unique" },
    { key: { active: 1 }, name: "active" },
  ],

  [COLLECTIONS.cars]: [
    { key: { slug: 1 }, unique: true, name: "slug_unique" },
    { key: { vin: 1 }, unique: true, sparse: true, name: "vin_unique" },
    // The fleet grid's default query: available cars, cheapest first.
    { key: { available: 1, pricePerDay: 1 }, name: "available_price" },
    { key: { locationId: 1, available: 1 }, name: "location_available" },
    { key: { bodyType: 1, fuelType: 1 }, name: "bodyType_fuelType" },
  ],

  [COLLECTIONS.reservations]: [
    { key: { reference: 1 }, unique: true, name: "reference_unique" },
    /* Availability is resolved by these three fields on every search — both
     * fleet-wide (findBookedCarIds) and per car (hasOverlap). Status leads
     * because it is an equality match, then the date range. */
    { key: { status: 1, pickupAt: 1, returnAt: 1 }, name: "status_window" },
    { key: { carId: 1, status: 1, pickupAt: 1, returnAt: 1 }, name: "car_status_window" },
    { key: { userId: 1, createdAt: -1 }, name: "user_recent" },
  ],

  [COLLECTIONS.payments]: [
    // Stripe's intent id is the webhook's lookup key; unique makes a replayed
    // webhook idempotent instead of creating a duplicate payment.
    { key: { stripeIntentId: 1 }, unique: true, sparse: true, name: "stripeIntent_unique" },
    { key: { idempotencyKey: 1 }, unique: true, sparse: true, name: "idempotencyKey_unique" },
    { key: { reservationId: 1, status: 1 }, name: "reservation_status" },
  ],

  [COLLECTIONS.reviews]: [
    // One review per completed trip.
    { key: { reservationId: 1 }, unique: true, name: "reservation_unique" },
    { key: { carId: 1, createdAt: -1 }, name: "car_recent" },
    { key: { userId: 1 }, name: "user" },
  ],

  [COLLECTIONS.promoCodes]: [
    { key: { code: 1 }, unique: true, name: "code_unique" },
    { key: { active: 1 }, name: "active" },
  ],
};
