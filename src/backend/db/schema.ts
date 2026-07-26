import type { ObjectId } from "mongodb";
import {
  BODY_TYPES,
  FUEL_TYPES,
  PAYMENT_KINDS,
  PAYMENT_STATUSES,
  RESERVATION_STATUSES,
  TRANSMISSIONS,
  USER_ROLES,
  type BodyType,
  type FuelType,
  type PaymentKind,
  type PaymentStatus,
  type ReservationStatus,
  type Transmission,
  type UserRole,
} from "@/shared/constants";

/* ---------------------------------------------------------------------
 * The data model, in one place.
 *
 * Three layers describe each collection, and they are meant to be read
 * together:
 *
 *   1. A `*Doc` interface — the shape as MongoDB stores it, ObjectIds and
 *      Date objects included. Repositories are typed against these.
 *   2. A `$jsonSchema` validator — the same rules enforced by the database,
 *      so a stray script or a mongosh session cannot write a malformed
 *      document. Applied by `ensure-indexes.ts`.
 *   3. Index definitions, in `indexes.ts`, including the unique constraints
 *      the model depends on.
 *
 * Enum values are imported from shared/constants.ts rather than redeclared,
 * so the database, the Zod schemas guarding the API, and the UI can never
 * drift apart.
 * ------------------------------------------------------------------- */

export const COLLECTIONS = {
  users: "users",
  locations: "locations",
  cars: "cars",
  reservations: "reservations",
  payments: "payments",
  reviews: "reviews",
  promoCodes: "promoCodes",
} as const;

/* ------------------------------ Documents ---------------------------- */

/** Renters and staff. The auth fields are nullable so a guest can still book
 *  by email alone: the reservation flow upserts a user with no password, and
 *  signing up later fills the same record in rather than creating a second. */
export interface UserDoc {
  _id: ObjectId;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  passwordHash: string | null;
  emailVerified: Date | null;
  image: string | null;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

/** Branches a car can be picked up from or returned to. Replaces the
 *  hard-coded LOCATIONS array once the read path is wired up. */
export interface LocationDoc {
  _id: ObjectId;
  name: string;
  slug: string;
  address: string;
  city: string;
  state: string;
  country: string;
  lat: number | null;
  lng: number | null;
  timezone: string;
  active: boolean;
}

export interface CarDoc {
  _id: ObjectId;
  slug: string;
  make: string;
  model: string;
  year: number;
  bodyType: BodyType;
  fuelType: FuelType;
  transmission: Transmission;
  seats: number;
  pricePerDay: number;
  imageUrl: string;
  mileage: string | null;
  description: string | null;
  vin: string | null;
  available: boolean;
  locationId: ObjectId;
  /** Denormalised review aggregates, recomputed when a review lands, so the
   *  fleet grid does not need a lookup per card. */
  ratingAvg: number;
  reviewCount: number;
  tripCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReservationDoc {
  _id: ObjectId;
  /** Human-readable booking reference used in emails and support. */
  reference: string;
  carId: ObjectId;
  userId: ObjectId;
  pickupLocationId: ObjectId;
  dropoffLocationId: ObjectId;
  pickupAt: Date;
  returnAt: Date;
  /** Kept on the booking so the quote can be re-derived and audited: pricing
   *  depends on it, and a renter's age changes between bookings. */
  driverAge: number;
  /* The full price breakdown, mirroring Quote in shared/lib/pricing.ts, so a
   * charge can always be explained without re-running pricing against
   * today's rates. */
  days: number;
  baseTotal: number;
  youngDriverFee: number;
  discount: number;
  totalPrice: number;
  currency: string;
  promoCodeId: ObjectId | null;
  status: ReservationStatus;
  cancelledAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaymentDoc {
  _id: ObjectId;
  reservationId: ObjectId;
  kind: PaymentKind;
  status: PaymentStatus;
  amount: number;
  currency: string;
  refundedAmount: number;
  /** Set once Stripe creates the intent. The webhook looks a payment up by
   *  it, and the unique index makes replayed webhooks idempotent. */
  stripeIntentId: string | null;
  idempotencyKey: string | null;
  failureReason: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReviewDoc {
  _id: ObjectId;
  /** One review per completed trip, enforced by a unique index. */
  reservationId: ObjectId;
  carId: ObjectId;
  userId: ObjectId;
  rating: number;
  comment: string | null;
  createdAt: Date;
}

export interface PromoCodeDoc {
  _id: ObjectId;
  /** Stored upper case; callers normalise before querying. */
  code: string;
  percentOff: number | null;
  amountOff: number | null;
  minDays: number | null;
  maxRedemptions: number | null;
  timesRedeemed: number;
  validFrom: Date | null;
  validTo: Date | null;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/* -------------------------- Collection validators ---------------------
 * MongoDB's own schema enforcement. This is what replaces the guarantees a
 * generated ORM client used to give: the driver is untyped at runtime, so
 * without these a typo in a `$set` writes a malformed document silently.
 *
 * Nullable fields are declared as ["<type>", "null"] and still listed under
 * `required`, so the key must be present even when empty — that keeps
 * documents uniform and makes queries on missing data predictable.
 */

type JsonSchema = Record<string, unknown>;

const objectId = { bsonType: "objectId" };
const nullableString = { bsonType: ["string", "null"] };
const nullableDate = { bsonType: ["date", "null"] };
const nullableNumber = { bsonType: ["double", "int", "long", "null"] };
const number = { bsonType: ["double", "int", "long"] };
const int = { bsonType: ["int", "long"] };

function validator(properties: JsonSchema, required: string[]): JsonSchema {
  return {
    $jsonSchema: {
      bsonType: "object",
      required: ["_id", ...required],
      // Reject unknown keys, so a renamed field cannot quietly coexist with
      // its old spelling.
      additionalProperties: false,
      properties: { _id: objectId, ...properties },
    },
  };
}

export const VALIDATORS: Record<string, JsonSchema> = {
  [COLLECTIONS.users]: validator(
    {
      firstName: { bsonType: "string", minLength: 1 },
      lastName: { bsonType: "string", minLength: 1 },
      email: { bsonType: "string", pattern: "^.+@.+\\..+$" },
      phone: nullableString,
      passwordHash: nullableString,
      emailVerified: nullableDate,
      image: nullableString,
      role: { enum: [...USER_ROLES] },
      createdAt: { bsonType: "date" },
      updatedAt: { bsonType: "date" },
    },
    [
      "firstName",
      "lastName",
      "email",
      "phone",
      "passwordHash",
      "emailVerified",
      "image",
      "role",
      "createdAt",
      "updatedAt",
    ]
  ),

  [COLLECTIONS.locations]: validator(
    {
      name: { bsonType: "string", minLength: 1 },
      slug: { bsonType: "string", minLength: 1 },
      address: { bsonType: "string" },
      city: { bsonType: "string" },
      state: { bsonType: "string" },
      country: { bsonType: "string" },
      lat: nullableNumber,
      lng: nullableNumber,
      timezone: { bsonType: "string" },
      active: { bsonType: "bool" },
    },
    [
      "name",
      "slug",
      "address",
      "city",
      "state",
      "country",
      "lat",
      "lng",
      "timezone",
      "active",
    ]
  ),

  [COLLECTIONS.cars]: validator(
    {
      slug: { bsonType: "string", minLength: 1 },
      make: { bsonType: "string", minLength: 1 },
      model: { bsonType: "string", minLength: 1 },
      year: int,
      bodyType: { enum: [...BODY_TYPES] },
      fuelType: { enum: [...FUEL_TYPES] },
      transmission: { enum: [...TRANSMISSIONS] },
      seats: int,
      pricePerDay: { ...number, minimum: 0 },
      imageUrl: { bsonType: "string" },
      mileage: nullableString,
      description: nullableString,
      vin: nullableString,
      available: { bsonType: "bool" },
      locationId: objectId,
      ratingAvg: { ...number, minimum: 0, maximum: 5 },
      reviewCount: { ...int, minimum: 0 },
      tripCount: { ...int, minimum: 0 },
      createdAt: { bsonType: "date" },
      updatedAt: { bsonType: "date" },
    },
    [
      "slug",
      "make",
      "model",
      "year",
      "bodyType",
      "fuelType",
      "transmission",
      "seats",
      "pricePerDay",
      "imageUrl",
      "mileage",
      "description",
      "vin",
      "available",
      "locationId",
      "ratingAvg",
      "reviewCount",
      "tripCount",
      "createdAt",
      "updatedAt",
    ]
  ),

  [COLLECTIONS.reservations]: validator(
    {
      reference: { bsonType: "string", minLength: 1 },
      carId: objectId,
      userId: objectId,
      pickupLocationId: objectId,
      dropoffLocationId: objectId,
      pickupAt: { bsonType: "date" },
      returnAt: { bsonType: "date" },
      driverAge: int,
      days: { ...int, minimum: 1 },
      baseTotal: { ...number, minimum: 0 },
      youngDriverFee: { ...number, minimum: 0 },
      discount: { ...number, minimum: 0 },
      totalPrice: { ...number, minimum: 0 },
      currency: { bsonType: "string" },
      promoCodeId: { bsonType: ["objectId", "null"] },
      status: { enum: [...RESERVATION_STATUSES] },
      cancelledAt: nullableDate,
      createdAt: { bsonType: "date" },
      updatedAt: { bsonType: "date" },
    },
    [
      "reference",
      "carId",
      "userId",
      "pickupLocationId",
      "dropoffLocationId",
      "pickupAt",
      "returnAt",
      "driverAge",
      "days",
      "baseTotal",
      "youngDriverFee",
      "discount",
      "totalPrice",
      "currency",
      "promoCodeId",
      "status",
      "cancelledAt",
      "createdAt",
      "updatedAt",
    ]
  ),

  [COLLECTIONS.payments]: validator(
    {
      reservationId: objectId,
      kind: { enum: [...PAYMENT_KINDS] },
      status: { enum: [...PAYMENT_STATUSES] },
      amount: { ...number, minimum: 0 },
      currency: { bsonType: "string" },
      refundedAmount: { ...number, minimum: 0 },
      stripeIntentId: nullableString,
      idempotencyKey: nullableString,
      failureReason: nullableString,
      createdAt: { bsonType: "date" },
      updatedAt: { bsonType: "date" },
    },
    [
      "reservationId",
      "kind",
      "status",
      "amount",
      "currency",
      "refundedAmount",
      "stripeIntentId",
      "idempotencyKey",
      "failureReason",
      "createdAt",
      "updatedAt",
    ]
  ),

  [COLLECTIONS.reviews]: validator(
    {
      reservationId: objectId,
      carId: objectId,
      userId: objectId,
      rating: { ...int, minimum: 1, maximum: 5 },
      comment: nullableString,
      createdAt: { bsonType: "date" },
    },
    ["reservationId", "carId", "userId", "rating", "comment", "createdAt"]
  ),

  [COLLECTIONS.promoCodes]: validator(
    {
      code: { bsonType: "string", minLength: 1 },
      percentOff: nullableNumber,
      amountOff: nullableNumber,
      minDays: { bsonType: ["int", "long", "null"] },
      maxRedemptions: { bsonType: ["int", "long", "null"] },
      timesRedeemed: { ...int, minimum: 0 },
      validFrom: nullableDate,
      validTo: nullableDate,
      active: { bsonType: "bool" },
      createdAt: { bsonType: "date" },
      updatedAt: { bsonType: "date" },
    },
    [
      "code",
      "percentOff",
      "amountOff",
      "minDays",
      "maxRedemptions",
      "timesRedeemed",
      "validFrom",
      "validTo",
      "active",
      "createdAt",
      "updatedAt",
    ]
  ),
};
