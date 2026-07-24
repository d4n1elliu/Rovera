import { PrismaClient } from "@prisma/client";
import { cars } from "./data/cars.json";

const prisma = new PrismaClient();

// Field mapping from the old CarDeal data format to the Rovera schema.
const FUEL_MAP: Record<string, string> = {
  Gasoline: "petrol",
  Diesel: "diesel",
  Hybrid: "hybrid",
  Electric: "electric",
};

const BODY_MAP: Record<string, string> = {
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

async function main() {
  await prisma.reservation.deleteMany();
  await prisma.car.deleteMany();

  for (const car of cars) {
    await prisma.car.create({
      data: {
        make: car.brand,
        model: car.carModel,
        year: car.yearOfManufacture,
        bodyType: BODY_MAP[car.carType] ?? "sedan",
        fuelType: FUEL_MAP[car.fuelType] ?? "petrol",
        transmission: MANUAL_MODELS.has(car.carModel) ? "manual" : "automatic",
        seats: SEATS[car.carModel] ?? 5,
        pricePerDay: car.pricePerDay,
        imageUrl: `/car_images/${car.image}`,
        mileage: car.mileage,
        description: car.description,
        vin: car.vin,
        available: car.available,
      },
    });
  }

  console.log(`Seeded ${cars.length} cars.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
