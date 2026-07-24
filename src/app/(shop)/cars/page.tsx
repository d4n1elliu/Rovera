import type { Metadata } from "next";
import { getCars } from "@/backend/services/car.service";
import { CarGrid } from "@/frontend/components/features/cars/car-grid";
import { SearchBar } from "@/frontend/components/features/cars/search-bar";
import type { Car } from "@/shared/types";

export const metadata: Metadata = { title: "Browse cars" };

export default async function CarsPage({
  searchParams,
}: {
  searchParams: { bodyType?: string; fuelType?: string; minPrice?: string; maxPrice?: string };
}) {
  const cars = (await getCars(searchParams)) as unknown as Car[];

  return (
    <div className="w-full space-y-6 px-4 py-8 sm:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-bold">Browse cars</h1>
        <SearchBar />
      </div>
      <CarGrid cars={cars} />
    </div>
  );
}
