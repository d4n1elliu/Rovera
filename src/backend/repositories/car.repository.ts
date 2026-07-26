import "server-only";
import { ObjectId, type Filter } from "mongodb";
import { carsCollection } from "@/backend/db/collections";
import type { CarDoc } from "@/backend/db/schema";
import type { CarFiltersInput } from "@/shared/schemas/car.schema";

/** Translate validated filter input into a MongoDB query. Kept separate so
 *  the fleet list and any future count share one definition of "matches". */
function buildFilter(filters: CarFiltersInput): Filter<CarDoc> {
  const query: Filter<CarDoc> = { available: true };

  if (filters.bodyType) query.bodyType = filters.bodyType;
  if (filters.fuelType) query.fuelType = filters.fuelType;

  if (filters.minPrice != null || filters.maxPrice != null) {
    query.pricePerDay = {
      ...(filters.minPrice != null && { $gte: filters.minPrice }),
      ...(filters.maxPrice != null && { $lte: filters.maxPrice }),
    };
  }

  if (filters.query) {
    // Escaped, so a stray "(" typed into the search box cannot throw.
    const pattern = filters.query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    query.$or = [
      { make: { $regex: pattern, $options: "i" } },
      { model: { $regex: pattern, $options: "i" } },
    ];
  }

  return query;
}

export const carRepository = {
  async findMany(filters: CarFiltersInput = {}) {
    const cars = await carsCollection();
    return cars.find(buildFilter(filters)).sort({ pricePerDay: 1 }).toArray();
  },

  async findById(id: string) {
    // A hand-edited URL can carry anything; an invalid id is a miss, not a
    // BSONError thrown out of the request.
    if (!ObjectId.isValid(id)) return null;
    const cars = await carsCollection();
    return cars.findOne({ _id: new ObjectId(id) });
  },

  async findBySlug(slug: string) {
    const cars = await carsCollection();
    return cars.findOne({ slug });
  },
};
