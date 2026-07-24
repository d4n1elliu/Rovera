import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Seed data — replace/extend with the contents of cars.json / orders.json
// from the old PHP project.
const cars = [
  {
    make: "Toyota",
    model: "Corolla",
    year: 2023,
    bodyType: "sedan",
    fuelType: "hybrid",
    transmission: "automatic",
    seats: 5,
    pricePerDay: 45,
    imageUrl: "/car_images/toyota-corolla.png",
  },
  {
    make: "Honda",
    model: "CR-V",
    year: 2024,
    bodyType: "suv",
    fuelType: "petrol",
    transmission: "automatic",
    seats: 5,
    pricePerDay: 68,
    imageUrl: "/car_images/honda-crv.png",
  },
  {
    make: "Tesla",
    model: "Model 3",
    year: 2024,
    bodyType: "sedan",
    fuelType: "electric",
    transmission: "automatic",
    seats: 5,
    pricePerDay: 95,
    imageUrl: "/car_images/tesla-model3.png",
  },
];

async function main() {
  await prisma.reservation.deleteMany();
  await prisma.car.deleteMany();

  for (const car of cars) {
    await prisma.car.create({ data: car });
  }

  console.log(`Seeded ${cars.length} cars.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
