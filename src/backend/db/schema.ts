import { relations, sql } from "drizzle-orm";
import {
  boolean,
  check,
  customType,
  index,
  integer,
  numeric,
  pgEnum,
  pgTable,
  smallint,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import {
  BODY_TYPES,
  FUEL_TYPES,
  MAX_REVIEW_RATING,
  MIN_REVIEW_RATING,
  PAYMENT_KINDS,
  PAYMENT_STATUSES,
  RESERVATION_STATUSES,
  TRANSMISSIONS,
  USER_ROLES,
} from "@/shared/constants";

/* ---------------------------------------------------------------------
 * The data model, in one place.
 *
 * This single file is the whole schema: table definitions, the constraints
 * the model depends on, and the indexes that keep listing and availability
 * queries off sequential scans. `drizzle-kit generate` diffs it into
 * versioned SQL under drizzle/, so a schema change is reviewable as SQL and
 * applied the same way in every environment.
 *
 * Three things the database itself now enforces, rather than trusting the
 * application to get them right:
 *
 *   1. Column types and NOT NULL — a missing field is a write error, not a
 *      silently malformed row.
 *   2. Foreign keys — a reservation cannot reference a car that does not
 *      exist, and deleting a car that has bookings is refused.
 *   3. CHECK constraints and enums — the value ranges and vocabularies the
 *      pricing and booking logic assume.
 *
 * Taken together they mean an invalid row cannot be written by any route —
 * the application, a migration, a maintenance script, or a hand-typed
 * statement in the SQL editor.
 *
 * Every table calls `.enableRLS()` and defines NO policies. That combination
 * is deliberate rather than half-finished: row level security with no policy
 * denies everyone. Supabase publishes a REST API over these tables to anyone
 * holding the anon key, and nothing here uses it — all access goes through
 * the repositories, which connect as `postgres` and bypass RLS. So the rule
 * being expressed is "deny every caller that is not this application", and
 * RLS on with no policies is precisely that.
 *
 * It lives in the schema rather than being switched on in the Supabase
 * dashboard so a new environment cannot come up unprotected: `npm run
 * db:migrate` applies it everywhere. Add a policy only when something is
 * genuinely meant to be reachable with the anon key.
 *
 * Enum values come from shared/constants.ts rather than being redeclared, so
 * the database, the Zod schemas guarding the API, and the UI cannot drift
 * apart.
 *
 * Column names are snake_case in Postgres and camelCase in TypeScript. That
 * mapping is automatic via `casing: "snake_case"`, configured in BOTH
 * db/client.ts and drizzle.config.ts — they must agree, or generated
 * migrations will not match the queries the app runs.
 * ------------------------------------------------------------------- */

/* ------------------------------- Types ------------------------------- */

/**
 * Money, stored as `numeric` so totals are exact.
 *
 * Postgres returns numeric as a string, precisely to avoid the precision loss
 * that makes float unsuitable for money, and postgres.js passes that string
 * through untouched. Converting here keeps every price a `number` in
 * TypeScript — which is what shared/lib/pricing.ts and the UI already
 * expect — while the stored value stays exact.
 */
const money = customType<{ data: number; driverData: string }>({
  dataType: () => "numeric(10, 2)",
  fromDriver: (value) => Number(value),
  toDriver: (value) => value.toString(),
});

/** A 0.0–5.0 star average. Same string/number treatment as `money`. */
const rating = customType<{ data: number; driverData: string }>({
  dataType: () => "numeric(2, 1)",
  fromDriver: (value) => Number(value),
  toDriver: (value) => value.toString(),
});

/** Carried by every table that is written to more than once. */
const timestamps = {
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
};

/* ------------------------------- Enums ------------------------------- */

/* Real Postgres enum types, so an invalid value is rejected by the database
 * and pg_enum documents the vocabulary to anything else reading the schema. */

export const bodyTypeEnum = pgEnum("body_type", BODY_TYPES);
export const fuelTypeEnum = pgEnum("fuel_type", FUEL_TYPES);
export const transmissionEnum = pgEnum("transmission", TRANSMISSIONS);
export const userRoleEnum = pgEnum("user_role", USER_ROLES);
export const reservationStatusEnum = pgEnum("reservation_status", RESERVATION_STATUSES);
export const paymentKindEnum = pgEnum("payment_kind", PAYMENT_KINDS);
export const paymentStatusEnum = pgEnum("payment_status", PAYMENT_STATUSES);

/* ------------------------------- Tables ------------------------------ */

/** Renters and staff. The auth fields are nullable so a guest can still book
 *  by email alone: the reservation flow upserts a user with no password, and
 *  signing up later fills the same row in rather than creating a second. */
export const users = pgTable(
  "users",
  {
    id: uuid().primaryKey().defaultRandom(),
    firstName: text().notNull(),
    lastName: text().notNull(),
    /** Always stored lower case — see normalizeEmail in backend/lib/email.ts.
     *  That makes a plain unique constraint case-insensitive in effect, and
     *  lets ON CONFLICT infer it. */
    email: text().notNull().unique(),
    phone: text(),
    passwordHash: text(),
    emailVerified: timestamp({ withTimezone: true }),
    image: text(),
    role: userRoleEnum().notNull().default("customer"),
    ...timestamps,
  },
  (table) => [
    /* Normalisation is enforced here rather than trusted to the application,
     * so "A@b.com" cannot be inserted alongside "a@b.com" by a script that
     * forgot to lower-case it. citext would express this at the type level,
     * but the extension is not enabled by default on Supabase. */
    check("users_email_lower_case", sql`${table.email} = lower(${table.email})`),
    check("users_email_format", sql`${table.email} ~ '^.+@.+\\..+$'`),
    check("users_first_name_not_blank", sql`length(trim(${table.firstName})) > 0`),
    check("users_last_name_not_blank", sql`length(trim(${table.lastName})) > 0`),
  ]
).enableRLS();

/** Branches a car can be picked up from or returned to. Replaces the
 *  hard-coded LOCATIONS array once the read path is wired up. */
export const locations = pgTable(
  "locations",
  {
    id: uuid().primaryKey().defaultRandom(),
    name: text().notNull().unique(),
    slug: text().notNull().unique(),
    address: text().notNull(),
    city: text().notNull(),
    state: text().notNull(),
    country: text().notNull(),
    lat: numeric({ precision: 9, scale: 6, mode: "number" }),
    lng: numeric({ precision: 9, scale: 6, mode: "number" }),
    timezone: text().notNull(),
    active: boolean().notNull().default(true),
  },
  (table) => [index("locations_active").on(table.active)]
).enableRLS();

export const cars = pgTable(
  "cars",
  {
    id: uuid().primaryKey().defaultRandom(),
    slug: text().notNull().unique(),
    make: text().notNull(),
    model: text().notNull(),
    year: smallint().notNull(),
    bodyType: bodyTypeEnum().notNull(),
    fuelType: fuelTypeEnum().notNull(),
    transmission: transmissionEnum().notNull(),
    seats: smallint().notNull(),
    pricePerDay: money().notNull(),
    imageUrl: text().notNull(),
    mileage: text(),
    description: text(),
    vin: text(),
    available: boolean().notNull().default(true),
    /* A car must live somewhere, and `restrict` refuses to delete a branch
     * that still has cars rather than orphaning them. */
    locationId: uuid()
      .notNull()
      .references(() => locations.id, { onDelete: "restrict" }),
    /** Denormalised review aggregates, recomputed when a review lands, so the
     *  fleet grid does not need a join per card. */
    ratingAvg: rating().notNull().default(0),
    reviewCount: integer().notNull().default(0),
    tripCount: integer().notNull().default(0),
    ...timestamps,
  },
  (table) => [
    /* Unique, but nullable: Postgres treats NULLs as distinct, so the VIN is
     * enforced unique where recorded while any number of cars without one can
     * coexist. */
    uniqueIndex("cars_vin_unique").on(table.vin),
    // The fleet grid's price sorts: available cars, cheapest (or dearest) first.
    index("cars_available_price").on(table.available, table.pricePerDay),
    /* The "Recommended" and "Top rated" sorts. Leading with `available`
     * matches the equality filter every listing query applies, so the index
     * serves both the filter and the sort in one pass. */
    index("cars_available_rating").on(
      table.available,
      table.ratingAvg.desc(),
      table.reviewCount.desc()
    ),
    index("cars_location_available").on(table.locationId, table.available),
    index("cars_body_fuel").on(table.bodyType, table.fuelType),
    check("cars_price_non_negative", sql`${table.pricePerDay} >= 0`),
    check("cars_seats_positive", sql`${table.seats} > 0`),
    check("cars_rating_range", sql`${table.ratingAvg} between 0 and 5`),
    check("cars_review_count_non_negative", sql`${table.reviewCount} >= 0`),
    check("cars_trip_count_non_negative", sql`${table.tripCount} >= 0`),
  ]
).enableRLS();

export const reservations = pgTable(
  "reservations",
  {
    id: uuid().primaryKey().defaultRandom(),
    /** Human-readable booking reference used in emails and support. */
    reference: text().notNull().unique(),
    carId: uuid()
      .notNull()
      .references(() => cars.id, { onDelete: "restrict" }),
    userId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    pickupLocationId: uuid()
      .notNull()
      .references(() => locations.id, { onDelete: "restrict" }),
    dropoffLocationId: uuid()
      .notNull()
      .references(() => locations.id, { onDelete: "restrict" }),
    pickupAt: timestamp({ withTimezone: true }).notNull(),
    returnAt: timestamp({ withTimezone: true }).notNull(),
    /** Kept on the booking so the quote can be re-derived and audited: pricing
     *  depends on it, and a renter's age changes between bookings. */
    driverAge: smallint().notNull(),
    /* The full price breakdown, mirroring Quote in shared/lib/pricing.ts, so a
     * charge can always be explained without re-running pricing against
     * today's rates. */
    days: integer().notNull(),
    baseTotal: money().notNull(),
    youngDriverFee: money().notNull(),
    discount: money().notNull(),
    totalPrice: money().notNull(),
    currency: text().notNull(),
    /* A promotion can be retired without erasing which booking used it, so
     * this nulls out rather than blocking the delete. */
    promoCodeId: uuid().references(() => promoCodes.id, { onDelete: "set null" }),
    status: reservationStatusEnum().notNull().default("pending"),
    cancelledAt: timestamp({ withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    /* Availability is resolved by these fields on every search — both
     * fleet-wide (findBookedCarIds) and per car (hasOverlap). Status leads
     * because it is an equality match, then the date range. */
    index("reservations_status_window").on(table.status, table.pickupAt, table.returnAt),
    index("reservations_car_status_window").on(
      table.carId,
      table.status,
      table.pickupAt,
      table.returnAt
    ),
    index("reservations_user_recent").on(table.userId, table.createdAt.desc()),
    /* A rental cannot end before it starts — the day count, and every total
     * derived from it, depends on this holding. */
    check("reservations_window_ordered", sql`${table.returnAt} > ${table.pickupAt}`),
    check("reservations_days_positive", sql`${table.days} >= 1`),
    check(
      "reservations_totals_non_negative",
      sql`${table.baseTotal} >= 0 and ${table.youngDriverFee} >= 0 and ${table.discount} >= 0 and ${table.totalPrice} >= 0`
    ),
  ]
).enableRLS();

export const payments = pgTable(
  "payments",
  {
    id: uuid().primaryKey().defaultRandom(),
    reservationId: uuid()
      .notNull()
      .references(() => reservations.id, { onDelete: "cascade" }),
    kind: paymentKindEnum().notNull(),
    status: paymentStatusEnum().notNull(),
    amount: money().notNull(),
    currency: text().notNull(),
    refundedAmount: money().notNull().default(0),
    /** Set once Stripe creates the intent. The webhook looks a payment up by
     *  it, and the unique index makes a replayed webhook idempotent. */
    stripeIntentId: text(),
    idempotencyKey: text(),
    failureReason: text(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("payments_stripe_intent_unique").on(table.stripeIntentId),
    uniqueIndex("payments_idempotency_key_unique").on(table.idempotencyKey),
    index("payments_reservation_status").on(table.reservationId, table.status),
    check("payments_amount_non_negative", sql`${table.amount} >= 0`),
    // A refund cannot exceed what was charged.
    check(
      "payments_refund_within_amount",
      sql`${table.refundedAmount} >= 0 and ${table.refundedAmount} <= ${table.amount}`
    ),
  ]
).enableRLS();

export const reviews = pgTable(
  "reviews",
  {
    id: uuid().primaryKey().defaultRandom(),
    /** One review per completed trip, enforced by the unique constraint. */
    reservationId: uuid()
      .notNull()
      .unique()
      .references(() => reservations.id, { onDelete: "cascade" }),
    carId: uuid()
      .notNull()
      .references(() => cars.id, { onDelete: "cascade" }),
    userId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    rating: smallint().notNull(),
    comment: text(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("reviews_car_recent").on(table.carId, table.createdAt.desc()),
    index("reviews_user").on(table.userId),
    check(
      "reviews_rating_range",
      sql`${table.rating} between ${sql.raw(String(MIN_REVIEW_RATING))} and ${sql.raw(String(MAX_REVIEW_RATING))}`
    ),
  ]
).enableRLS();

export const promoCodes = pgTable(
  "promo_codes",
  {
    id: uuid().primaryKey().defaultRandom(),
    /** Stored upper case, which the CHECK below enforces; callers normalise
     *  before querying. */
    code: text().notNull().unique(),
    percentOff: numeric({ precision: 5, scale: 2, mode: "number" }),
    amountOff: money(),
    minDays: integer(),
    maxRedemptions: integer(),
    timesRedeemed: integer().notNull().default(0),
    validFrom: timestamp({ withTimezone: true }),
    validTo: timestamp({ withTimezone: true }),
    active: boolean().notNull().default(true),
    ...timestamps,
  },
  (table) => [
    index("promo_codes_active").on(table.active),
    check("promo_codes_upper_case", sql`${table.code} = upper(${table.code})`),
    /* A promotion is a percentage off or a fixed amount off — never both and
     * never neither, because pricing has no meaning for those two cases. */
    check(
      "promo_codes_one_discount_kind",
      sql`(${table.percentOff} is null) <> (${table.amountOff} is null)`
    ),
    check(
      "promo_codes_percent_range",
      sql`${table.percentOff} is null or ${table.percentOff} between 0 and 100`
    ),
    check("promo_codes_redeemed_non_negative", sql`${table.timesRedeemed} >= 0`),
  ]
).enableRLS();

/* ------------------------------ Relations ---------------------------- */

/* Declared so a repository can opt into Drizzle's relational queries
 * (`db.query.reservations.findMany({ with: { car: true } })`) instead of
 * hand-writing a join and stitching the rows back together. */

export const locationsRelations = relations(locations, ({ many }) => ({
  cars: many(cars),
}));

export const carsRelations = relations(cars, ({ one, many }) => ({
  location: one(locations, { fields: [cars.locationId], references: [locations.id] }),
  reservations: many(reservations),
  reviews: many(reviews),
}));

export const usersRelations = relations(users, ({ many }) => ({
  reservations: many(reservations),
  reviews: many(reviews),
}));

export const reservationsRelations = relations(reservations, ({ one, many }) => ({
  car: one(cars, { fields: [reservations.carId], references: [cars.id] }),
  user: one(users, { fields: [reservations.userId], references: [users.id] }),
  pickupLocation: one(locations, {
    fields: [reservations.pickupLocationId],
    references: [locations.id],
    relationName: "pickupLocation",
  }),
  dropoffLocation: one(locations, {
    fields: [reservations.dropoffLocationId],
    references: [locations.id],
    relationName: "dropoffLocation",
  }),
  promoCode: one(promoCodes, {
    fields: [reservations.promoCodeId],
    references: [promoCodes.id],
  }),
  payments: many(payments),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  reservation: one(reservations, {
    fields: [payments.reservationId],
    references: [reservations.id],
  }),
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
  reservation: one(reservations, {
    fields: [reviews.reservationId],
    references: [reservations.id],
  }),
  car: one(cars, { fields: [reviews.carId], references: [cars.id] }),
  user: one(users, { fields: [reviews.userId], references: [users.id] }),
}));

export const promoCodesRelations = relations(promoCodes, ({ many }) => ({
  reservations: many(reservations),
}));

/* -------------------------------- Rows -------------------------------
 * Inferred from the tables above, so a schema change updates them without a
 * second declaration to keep in step. Repositories are typed against these,
 * and backend/lib/serialize.ts maps them to the JSON shapes in shared/types.
 */

export type UserRow = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type LocationRow = typeof locations.$inferSelect;
export type NewLocation = typeof locations.$inferInsert;

export type CarRow = typeof cars.$inferSelect;
export type NewCar = typeof cars.$inferInsert;

export type ReservationRow = typeof reservations.$inferSelect;
export type NewReservation = typeof reservations.$inferInsert;

export type PaymentRow = typeof payments.$inferSelect;
export type NewPayment = typeof payments.$inferInsert;

export type ReviewRow = typeof reviews.$inferSelect;
export type NewReview = typeof reviews.$inferInsert;

export type PromoCodeRow = typeof promoCodes.$inferSelect;
export type NewPromoCode = typeof promoCodes.$inferInsert;
