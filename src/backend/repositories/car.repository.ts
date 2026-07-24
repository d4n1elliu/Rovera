import "server-only";
import { db } from "@/backend/db";
import type { CarFiltersInput } from "@/shared/schemas/car.schema";

export const carRepository = {
  findMany(filters: CarFiltersInput = {}) {
    return db.car.findMany({
      where: {
        available: true,
        ...(filters.bodyType && { bodyType: filters.bodyType }),
        ...(filters.fuelType && { fuelType: filters.fuelType }),
        ...((filters.minPrice != null || filters.maxPrice != null) && {
          pricePerDay: {
            ...(filters.minPrice != null && { gte: filters.minPrice }),
            ...(filters.maxPrice != null && { lte: filters.maxPrice }),
          },
        }),
        ...(filters.query && {
          OR: [
            { make: { contains: filters.query, mode: "insensitive" as const } },
            { model: { contains: filters.query, mode: "insensitive" as const } },
          ],
        }),
      },
      orderBy: { pricePerDay: "asc" },
    });
  },

  findById(id: string) {
    return db.car.findUnique({ where: { id } });
  },
};
