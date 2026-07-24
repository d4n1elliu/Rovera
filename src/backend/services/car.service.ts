import "server-only";
import { carRepository } from "@/backend/repositories/car.repository";
import { carFiltersSchema, type CarFiltersInput } from "@/shared/schemas/car.schema";

export async function getCars(rawFilters: unknown = {}) {
  const filters: CarFiltersInput = carFiltersSchema.parse(rawFilters);
  return carRepository.findMany(filters);
}

export async function getCarById(id: string) {
  const car = await carRepository.findById(id);
  if (!car) throw new Error(`Car not found: ${id}`);
  return car;
}

export async function searchCars(query: string) {
  if (!query.trim()) return [];
  return carRepository.findMany({ query });
}
