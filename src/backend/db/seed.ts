import { eq, sql } from "drizzle-orm";
import { closeDb, getDb } from "@/backend/db/client";
import {
  cars as carsTable,
  locations as locationsTable,
  payments as paymentsTable,
  promoCodes as promoCodesTable,
  reservations as reservationsTable,
  reviews as reviewsTable,
  users as usersTable,
  type CarRow,
} from "@/backend/db/schema";
import { recomputeCarAggregates } from "@/backend/db/aggregates";
import { normalizeEmail } from "@/backend/lib/email";
import {
  DEFAULT_CURRENCY,
  type BodyType,
  type FuelType,
  type Transmission,
} from "@/shared/constants";
import carsData from "@/backend/data/cars.json";

/* ---------------------------------------------------------------------
 * Seeds a database that is ready to develop against.
 *
 * Reference data (locations, promo codes, cars, users) is upserted on its
 * natural unique key via ON CONFLICT, so re-running the seed refreshes rows
 * rather than duplicating them. Only transactional data is cleared each run.
 *
 *   npm run db:seed     upsert reference data, replace reservations
 *   npm run db:reset    truncate every table first, then seed
 *
 * The schema itself is not created here — `npm run db:migrate` owns that. A
 * seed run against an unmigrated database fails with a clear instruction
 * rather than a bare "relation does not exist".
 * ------------------------------------------------------------------- */

const RESET = process.argv.includes("--reset");

/** Branches. Names match the LOCATIONS constant in shared/constants.ts. */
const LOCATIONS = [
  {
    name: "Sydney",
    slug: "sydney",
    address: "1 Bourke Street, Mascot NSW 2020",
    city: "Sydney",
    state: "NSW",
    lat: -33.9285,
    lng: 151.1908,
    timezone: "Australia/Sydney",
  },
  {
    name: "Melbourne",
    slug: "melbourne",
    address: "45 Francis Street, Tullamarine VIC 3043",
    city: "Melbourne",
    state: "VIC",
    lat: -37.6733,
    lng: 144.8433,
    timezone: "Australia/Melbourne",
  },
  {
    name: "Brisbane",
    slug: "brisbane",
    address: "12 Airport Drive, Eagle Farm QLD 4009",
    city: "Brisbane",
    state: "QLD",
    lat: -27.4295,
    lng: 153.0885,
    timezone: "Australia/Brisbane",
  },
  {
    name: "Perth",
    slug: "perth",
    address: "8 Horrie Miller Drive, Newburn WA 6105",
    city: "Perth",
    state: "WA",
    lat: -31.9403,
    lng: 115.9669,
    timezone: "Australia/Perth",
  },
  {
    name: "Adelaide",
    slug: "adelaide",
    address: "22 Sir Richard Williams Avenue, Netley SA 5037",
    city: "Adelaide",
    state: "SA",
    lat: -34.9285,
    lng: 138.5304,
    timezone: "Australia/Adelaide",
  },
];

/** Mirrors the PROMOTIONS array in shared/config/promotions.ts, which this
 *  table is intended to replace once the read path is wired up. */
const PROMO_CODES = [
  { code: "ROVERA10", percentOff: 10, amountOff: null, minDays: null },
  { code: "FIRSTTRIP", percentOff: null, amountOff: 25, minDays: null },
  { code: "LONGHAUL", percentOff: 20, amountOff: null, minDays: 7 },
];

const USERS = [
  {
    // Matches DEMO_EMAIL in app/(account)/rentals/page.tsx, so the rentals
    // page has history to show before auth exists.
    email: "demo@example.com",
    firstName: "Demo",
    lastName: "Renter",
    phone: "+61 400 000 000",
    role: "customer" as const,
  },
  {
    email: "admin@rovera.test",
    firstName: "Rovera",
    lastName: "Admin",
    phone: "+61 400 000 001",
    role: "admin" as const,
  },
];

/* Field mapping from the old CarDeal data format to the Rovera schema. */

const FUEL_MAP: Record<string, FuelType> = {
  Gasoline: "petrol",
  Diesel: "diesel",
  Hybrid: "hybrid",
  Electric: "electric",
};

const BODY_MAP: Record<string, BodyType> = {
  Sedan: "sedan",
  SUV: "suv",
  Hatchback: "hatchback",
  Coupe: "coupe",
  Convertible: "convertible",
  Van: "van",
  Pickup: "pickup",
  Wagon: "wagon",
  Electric: "sedan", // Tesla Model 3 — "Electric" is its fuel, not a body type
};

// Not present in the old data — sensible per-model defaults.
const SEATS: Record<string, number> = {
  "MX-5": 2,
  Mustang: 4,
  "C-Class Cabriolet": 4,
  HiAce: 12,
};

const MANUAL_MODELS = new Set(["MX-5", "Golf", "Cooper"]);

/** URL-safe identifier for a car, used for SEO-friendly detail links. */
function carSlug(year: number, make: string, model: string) {
  return `${year}-${make}-${model}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** A whole number of days from today at the given hour, so seeded bookings
 *  sit on predictable day boundaries. */
function daysFromToday(days: number, hour: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(hour, 0, 0, 0);
  return date;
}

/** Fails with an actionable message when the schema has not been applied,
 *  instead of letting a bare Postgres error surface. */
async function assertMigrated(db: ReturnType<typeof getDb>) {
  try {
    await db.select({ ok: sql`1` }).from(carsTable).limit(1);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (/relation .* does not exist/i.test(message)) {
      throw new Error(
        "The schema has not been applied yet. Run `npm run db:migrate` first."
      );
    }
    throw error;
  }
}

async function main() {
  const db = getDb();
  const now = new Date();

  await assertMigrated(db);

  if (RESET) {
    /* TRUNCATE rather than DROP: the tables belong to the migrations, and only
     * their contents are the seed's to replace. CASCADE because the foreign
     * keys make the order otherwise matter. */
    await db.execute(sql`
      truncate table
        ${reviewsTable}, ${paymentsTable}, ${reservationsTable},
        ${carsTable}, ${promoCodesTable}, ${locationsTable}, ${usersTable}
      cascade
    `);
    console.log("Truncated all tables.");
  }

  // Transactional data is recreated every run; reference data is upserted.
  await db.delete(reviewsTable);
  await db.delete(paymentsTable);
  await db.delete(reservationsTable);

  const locations = await db
    .insert(locationsTable)
    .values(LOCATIONS.map((location) => ({ ...location, country: "AU", active: true })))
    .onConflictDoUpdate({
      target: locationsTable.slug,
      set: {
        name: sql`excluded.name`,
        address: sql`excluded.address`,
        city: sql`excluded.city`,
        state: sql`excluded.state`,
        country: sql`excluded.country`,
        lat: sql`excluded.lat`,
        lng: sql`excluded.lng`,
        timezone: sql`excluded.timezone`,
        active: sql`excluded.active`,
      },
    })
    .returning();

  await db
    .insert(promoCodesTable)
    .values(
      PROMO_CODES.map((promo) => ({
        ...promo,
        maxRedemptions: null,
        validFrom: null,
        validTo: null,
        active: true,
        createdAt: now,
        updatedAt: now,
      }))
    )
    .onConflictDoUpdate({
      target: promoCodesTable.code,
      set: {
        percentOff: sql`excluded.percent_off`,
        amountOff: sql`excluded.amount_off`,
        minDays: sql`excluded.min_days`,
        maxRedemptions: sql`excluded.max_redemptions`,
        validFrom: sql`excluded.valid_from`,
        validTo: sql`excluded.valid_to`,
        active: sql`excluded.active`,
        updatedAt: now,
      },
      // timesRedeemed is deliberately left alone: it is transactional, and a
      // reseed must not reset a promotion's usage count.
    });

  await db
    .insert(usersTable)
    .values(
      USERS.map((user) => ({
        ...user,
        email: normalizeEmail(user.email),
        passwordHash: null,
        emailVerified: null,
        image: null,
        createdAt: now,
        updatedAt: now,
      }))
    )
    .onConflictDoUpdate({
      target: usersTable.email,
      set: {
        firstName: sql`excluded.first_name`,
        lastName: sql`excluded.last_name`,
        phone: sql`excluded.phone`,
        role: sql`excluded.role`,
        updatedAt: now,
      },
    });

  // Sorted by slug so the round-robin below assigns the same branch to the same
  // car on every run, whatever order Postgres returned the rows in.
  const orderedLocations = [...locations].sort((a, b) => a.slug.localeCompare(b.slug));

  const cars = await db
    .insert(carsTable)
    .values(
      carsData.cars.map((car, index) => ({
        slug: carSlug(car.yearOfManufacture, car.brand, car.carModel),
        make: car.brand,
        model: car.carModel,
        year: car.yearOfManufacture,
        bodyType: BODY_MAP[car.carType] ?? ("sedan" as BodyType),
        fuelType: FUEL_MAP[car.fuelType] ?? ("petrol" as FuelType),
        transmission: (MANUAL_MODELS.has(car.carModel)
          ? "manual"
          : "automatic") as Transmission,
        seats: SEATS[car.carModel] ?? 5,
        pricePerDay: car.pricePerDay,
        imageUrl: `/car_images/${car.image}`,
        mileage: car.mileage,
        description: car.description,
        vin: car.vin,
        available: car.available,
        // Spread the fleet across branches so location filtering has something
        // to filter once the search read path is wired up.
        locationId: orderedLocations[index % orderedLocations.length].id,
        createdAt: now,
        updatedAt: now,
      }))
    )
    .onConflictDoUpdate({
      target: carsTable.slug,
      set: {
        make: sql`excluded.make`,
        model: sql`excluded.model`,
        year: sql`excluded.year`,
        bodyType: sql`excluded.body_type`,
        fuelType: sql`excluded.fuel_type`,
        transmission: sql`excluded.transmission`,
        seats: sql`excluded.seats`,
        pricePerDay: sql`excluded.price_per_day`,
        imageUrl: sql`excluded.image_url`,
        mileage: sql`excluded.mileage`,
        description: sql`excluded.description`,
        vin: sql`excluded.vin`,
        available: sql`excluded.available`,
        locationId: sql`excluded.location_id`,
        updatedAt: now,
      },
      // ratingAvg / reviewCount / tripCount are derived, and are rewritten by
      // recomputeCarAggregates() at the end of this run.
    })
    .returning();

  const carBySlug = new Map<string, CarRow>(cars.map((car) => [car.slug, car]));

  const [demoUser] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, normalizeEmail(USERS[0].email)))
    .limit(1);

  if (!demoUser) throw new Error("Demo user was not created");

  /* Seeded bookings deliberately use a driver over the young-driver threshold
   * and carry no promo code, so the stored breakdown is simply
   * days x pricePerDay with no surcharge or discount. That keeps the fixture
   * totals correct without duplicating shared/lib/pricing.ts here. */
  const DRIVER_AGE = 30;

  const BOOKINGS = [
    {
      reference: "RVR-SEED01",
      slug: "2014-toyota-corolla",
      status: "completed" as const,
      startsIn: -21,
      days: 4,
    },
    {
      reference: "RVR-SEED02",
      slug: "2022-tesla-model-3",
      status: "confirmed" as const,
      startsIn: 5,
      days: 3,
    },
    {
      reference: "RVR-SEED03",
      slug: "2020-mazda-cx-5",
      status: "pending" as const,
      startsIn: 12,
      days: 6,
    },
  ];

  /* Past trips that have been reviewed. Each becomes a completed reservation
   * plus its review, so ratingAvg / reviewCount / tripCount are derived from
   * real rows rather than written by hand — the rating sort has to have
   * something meaningful to order by. */
  const REVIEWED_TRIPS = [
    { slug: "2022-tesla-model-3", rating: 5, comment: "Faultless. Charged once on a Sydney–Canberra run." },
    { slug: "2022-tesla-model-3", rating: 5, comment: "Second time renting this one. Spotless again." },
    { slug: "2022-tesla-model-3", rating: 4, comment: "Great car, though the charge cable was missing." },
    { slug: "2019-volvo-v60", rating: 5, comment: "Swallowed a family's worth of luggage without complaint." },
    { slug: "2019-volvo-v60", rating: 4, comment: "Comfortable on a long drive. Slightly thirsty." },
    { slug: "2020-mazda-cx-5", rating: 4, comment: "Easy to park for its size." },
    { slug: "2020-mazda-cx-5", rating: 4, comment: "Did exactly what we needed for a weekend away." },
    { slug: "2014-toyota-corolla", rating: 4, comment: "Cheap, reliable, no surprises." },
    { slug: "2014-toyota-corolla", rating: 3, comment: "Fine for the price. Showing its age inside." },
    { slug: "2022-mazda-mx-5", rating: 5, comment: "Worth every cent for the coast road." },
    { slug: "2018-subaru-forester", rating: 4, comment: "Handled a gravel road to the trailhead fine." },
    { slug: "2016-audi-a4", rating: 3, comment: "Quiet and smooth, but pickup took a while." },
  ];

  /* Built in memory and inserted in two statements rather than one round trip
   * per row, then linked by the ids the inserts return. */

  const pastTrips = REVIEWED_TRIPS.map((trip, index) => {
    const car = carBySlug.get(trip.slug);
    if (!car) {
      console.warn(`Skipping review: no car with slug ${trip.slug}`);
      return null;
    }

    // Spread the history backwards so trips do not all share one date.
    const startsIn = -(30 + index * 7);
    const days = 2 + (index % 4);
    const baseTotal = Math.round(days * car.pricePerDay * 100) / 100;

    return {
      trip,
      car,
      startsIn,
      days,
      reservation: {
        reference: `RVR-PAST${String(index + 1).padStart(2, "0")}`,
        carId: car.id,
        userId: demoUser.id,
        pickupLocationId: car.locationId,
        dropoffLocationId: car.locationId,
        pickupAt: daysFromToday(startsIn, 10),
        returnAt: daysFromToday(startsIn + days, 10),
        driverAge: DRIVER_AGE,
        days,
        baseTotal,
        youngDriverFee: 0,
        discount: 0,
        totalPrice: baseTotal,
        currency: DEFAULT_CURRENCY,
        promoCodeId: null,
        status: "completed" as const,
        cancelledAt: null,
        createdAt: now,
        updatedAt: now,
      },
    };
  }).filter((entry): entry is NonNullable<typeof entry> => entry !== null);

  const upcoming = BOOKINGS.map((booking) => {
    const car = carBySlug.get(booking.slug);
    if (!car) {
      console.warn(`Skipping ${booking.reference}: no car with slug ${booking.slug}`);
      return null;
    }

    const baseTotal = Math.round(booking.days * car.pricePerDay * 100) / 100;

    return {
      reference: booking.reference,
      carId: car.id,
      userId: demoUser.id,
      // The car's own branch, until the booking flow collects locations.
      pickupLocationId: car.locationId,
      dropoffLocationId: car.locationId,
      pickupAt: daysFromToday(booking.startsIn, 10),
      returnAt: daysFromToday(booking.startsIn + booking.days, 10),
      driverAge: DRIVER_AGE,
      days: booking.days,
      baseTotal,
      youngDriverFee: 0,
      discount: 0,
      totalPrice: baseTotal,
      currency: DEFAULT_CURRENCY,
      promoCodeId: null,
      status: booking.status,
      cancelledAt: null,
      createdAt: now,
      updatedAt: now,
    };
  }).filter((booking): booking is NonNullable<typeof booking> => booking !== null);

  const insertedPast = await db
    .insert(reservationsTable)
    .values(pastTrips.map((entry) => entry.reservation))
    .returning({ id: reservationsTable.id });

  await db.insert(reviewsTable).values(
    pastTrips.map((entry, index) => ({
      // Positional: .returning() preserves the order rows were supplied in.
      reservationId: insertedPast[index].id,
      carId: entry.car.id,
      userId: demoUser.id,
      rating: entry.trip.rating,
      comment: entry.trip.comment,
      createdAt: daysFromToday(entry.startsIn + entry.days, 18),
    }))
  );

  if (upcoming.length > 0) {
    await db.insert(reservationsTable).values(upcoming);
  }

  // Derived from the reviews and completed trips just inserted, using the same
  // code path the app uses, so seeded aggregates cannot drift from real ones.
  const { rated } = await recomputeCarAggregates();

  console.log(
    `Seeded ${locations.length} locations, ${PROMO_CODES.length} promo codes, ` +
      `${USERS.length} users, ${cars.length} cars, ` +
      `${upcoming.length + pastTrips.length} reservations, ${pastTrips.length} reviews ` +
      `(${rated} cars now rated).`
  );
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(closeDb);
