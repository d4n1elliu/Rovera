import { ObjectId } from "mongodb";
import { getClient, getDb } from "@/backend/db/client";
import { ensureSchema } from "@/backend/db/ensure-indexes";
import {
  carsCollection,
  locationsCollection,
  paymentsCollection,
  promoCodesCollection,
  reservationsCollection,
  reviewsCollection,
  usersCollection,
} from "@/backend/db/collections";
import { COLLECTIONS, type CarDoc, type LocationDoc } from "@/backend/db/schema";
import { DEFAULT_CURRENCY, type BodyType, type FuelType, type Transmission } from "@/shared/constants";
import { cars } from "@/backend/data/cars.json";

/* ---------------------------------------------------------------------
 * Seeds a database that is ready to develop against.
 *
 * Reference data (locations, promo codes, cars, users) is upserted on its
 * natural unique key, so re-running the seed refreshes rows rather than
 * duplicating them. Only transactional data is cleared each run.
 *
 *   npm run db:seed     upsert reference data, replace reservations
 *   npm run db:reset    drop every collection first, then seed
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
 *  collection is intended to replace once the read path is wired up. */
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

async function main() {
  const now = new Date();

  if (RESET) {
    const db = await getDb();
    for (const name of Object.values(COLLECTIONS)) {
      await db.collection(name).drop().catch(() => {
        // Collection did not exist — nothing to drop.
      });
    }
    console.log("Dropped all collections.");
  }

  // Validators and indexes must exist before the first insert, or the unique
  // constraints the upserts below rely on would not be enforced.
  await ensureSchema();

  const [users, locations, payments, reviews, reservations, promoCodes, carsCol] =
    await Promise.all([
      usersCollection(),
      locationsCollection(),
      paymentsCollection(),
      reviewsCollection(),
      reservationsCollection(),
      promoCodesCollection(),
      carsCollection(),
    ]);

  // Transactional data is recreated every run; reference data is upserted.
  await reviews.deleteMany({});
  await payments.deleteMany({});
  await reservations.deleteMany({});

  await Promise.all(
    LOCATIONS.map((location) =>
      locations.updateOne(
        { slug: location.slug },
        { $set: { ...location, country: "AU", active: true } },
        { upsert: true }
      )
    )
  );

  await Promise.all(
    PROMO_CODES.map((promo) =>
      promoCodes.updateOne(
        { code: promo.code },
        {
          $set: { ...promo, maxRedemptions: null, validFrom: null, validTo: null, active: true, updatedAt: now },
          $setOnInsert: { timesRedeemed: 0, createdAt: now },
        },
        { upsert: true }
      )
    )
  );

  await Promise.all(
    USERS.map((user) =>
      users.updateOne(
        { email: user.email },
        {
          $set: { ...user, updatedAt: now },
          $setOnInsert: {
            passwordHash: null,
            emailVerified: null,
            image: null,
            createdAt: now,
          },
        },
        { upsert: true }
      )
    )
  );

  const locationDocs = (await locations.find({}).sort({ slug: 1 }).toArray()) as LocationDoc[];

  await Promise.all(
    cars.map((car, index) => {
      const slug = carSlug(car.yearOfManufacture, car.brand, car.carModel);
      // Spread the fleet across branches so location filtering has something
      // to filter once the search read path is wired up.
      const locationId = locationDocs[index % locationDocs.length]._id;

      return carsCol.updateOne(
        { slug },
        {
          $set: {
            slug,
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
            locationId,
            updatedAt: now,
          },
          $setOnInsert: {
            ratingAvg: 0,
            reviewCount: 0,
            tripCount: 0,
            createdAt: now,
          },
        },
        { upsert: true }
      );
    })
  );

  const carDocs = (await carsCol.find({}).toArray()) as CarDoc[];
  const carBySlug = new Map(carDocs.map((car) => [car.slug, car]));
  const demoUser = await users.findOne({ email: USERS[0].email });

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

  let bookingCount = 0;

  for (const booking of BOOKINGS) {
    const car = carBySlug.get(booking.slug);
    if (!car) {
      console.warn(`Skipping ${booking.reference}: no car with slug ${booking.slug}`);
      continue;
    }

    const baseTotal = Math.round(booking.days * car.pricePerDay * 100) / 100;

    await reservations.insertOne({
      _id: new ObjectId(),
      reference: booking.reference,
      carId: car._id,
      userId: demoUser._id,
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
    });

    bookingCount++;
  }

  console.log(
    `Seeded ${locationDocs.length} locations, ${PROMO_CODES.length} promo codes, ` +
      `${USERS.length} users, ${carDocs.length} cars, ${bookingCount} reservations.`
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    const client = await getClient();
    await client.close();
  });
