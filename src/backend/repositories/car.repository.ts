import "server-only";
import { ObjectId, type Filter, type Sort } from "mongodb";
import { carsCollection } from "@/backend/db/collections";
import { recomputeCarAggregates as recomputeAggregates } from "@/backend/db/aggregates";
import type { CarDoc } from "@/backend/db/schema";
import {
  DEFAULT_CAR_SORT,
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  type CarSort,
} from "@/shared/constants";
import type { CarFiltersInput } from "@/shared/schemas/car.schema";

/** Translate validated filter input into a MongoDB query. Kept separate so
 *  the page query and its count share one definition of "matches". */
function buildFilter(filters: CarFiltersInput, excludeIds?: ObjectId[]): Filter<CarDoc> {
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

  // Cars held by an overlapping reservation are excluded in the query itself,
  // so the count and the page slice both already account for availability.
  if (excludeIds && excludeIds.length > 0) {
    query._id = { $nin: excludeIds };
  }

  return query;
}

/* Every order ends with _id so it is a total order. Without that tiebreaker,
 * documents sharing a sort value — two cars at the same price — can shift
 * between pages and end up shown twice or skipped entirely. */
const SORTS: Record<CarSort, Sort> = {
  // Well-reviewed first, cheapest among equals. Cars with no reviews yet have
  // ratingAvg 0, so they sort below rated ones rather than above them.
  recommended: { ratingAvg: -1, reviewCount: -1, pricePerDay: 1, _id: 1 },
  "price-asc": { pricePerDay: 1, _id: 1 },
  "price-desc": { pricePerDay: -1, _id: 1 },
  rating: { ratingAvg: -1, reviewCount: -1, _id: 1 },
};

export interface CarPageOptions {
  sort?: CarSort;
  page?: number;
  pageSize?: number;
  /** Cars to leave out — used to drop those already booked for the window. */
  excludeIds?: ObjectId[];
}

export interface CarPage {
  cars: CarDoc[];
  /** Cars matching the filters, ignoring the page slice. */
  total: number;
}

export const carRepository = {
  /** One page of the fleet, plus how many matched in total. The count runs
   *  against the same filter, so the two can never describe different sets. */
  async findPage(filters: CarFiltersInput = {}, options: CarPageOptions = {}): Promise<CarPage> {
    const cars = await carsCollection();
    const query = buildFilter(filters, options.excludeIds);

    const pageSize = Math.min(options.pageSize ?? DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);
    const page = Math.max(options.page ?? 1, 1);

    const [docs, total] = await Promise.all([
      cars
        .find(query)
        .sort(SORTS[options.sort ?? DEFAULT_CAR_SORT])
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .toArray(),
      cars.countDocuments(query),
    ]);

    return { cars: docs, total };
  },

  /** Every car matching the filters, unpaged — for callers that need the whole
   *  set, such as search suggestions. */
  async findMany(filters: CarFiltersInput = {}, sort: CarSort = DEFAULT_CAR_SORT) {
    const cars = await carsCollection();
    return cars.find(buildFilter(filters)).sort(SORTS[sort]).toArray();
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

  /** Refresh every car's denormalised review aggregates. */
  recomputeAggregates,
};
