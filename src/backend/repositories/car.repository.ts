import "server-only";
import {
  and,
  asc,
  count,
  desc,
  eq,
  gte,
  ilike,
  lte,
  notInArray,
  or,
  type SQL,
} from "drizzle-orm";
import { getDb } from "@/backend/db/client";
import { recomputeCarAggregates as recomputeAggregates } from "@/backend/db/aggregates";
import { cars, type CarRow } from "@/backend/db/schema";
import {
  DEFAULT_CAR_SORT,
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  type CarSort,
} from "@/shared/constants";
import type { CarFiltersInput } from "@/shared/schemas/car.schema";

/** Matches the canonical textual form of a UUID. A hand-edited URL can carry
 *  anything, and passing a non-UUID to a uuid column is a Postgres syntax
 *  error (22P02) rather than a miss — so it is checked before querying. */
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Escape the characters LIKE treats as wildcards, so a literal "%" typed into
 *  the search box matches a percent sign instead of everything. */
function escapeLike(value: string) {
  return value.replace(/[\\%_]/g, "\\$&");
}

/** Translate validated filter input into a WHERE clause. Kept separate so the
 *  page query and its count share one definition of "matches". */
function buildWhere(filters: CarFiltersInput, excludeIds?: string[]): SQL | undefined {
  const conditions: (SQL | undefined)[] = [eq(cars.available, true)];

  if (filters.bodyType) conditions.push(eq(cars.bodyType, filters.bodyType));
  if (filters.fuelType) conditions.push(eq(cars.fuelType, filters.fuelType));

  if (filters.minPrice != null) conditions.push(gte(cars.pricePerDay, filters.minPrice));
  if (filters.maxPrice != null) conditions.push(lte(cars.pricePerDay, filters.maxPrice));

  if (filters.query) {
    const pattern = `%${escapeLike(filters.query)}%`;
    // ILIKE rather than a case-insensitive regex: same result, and it can use
    // an index once the fleet is large enough to want a trigram one.
    conditions.push(or(ilike(cars.make, pattern), ilike(cars.model, pattern)));
  }

  // Cars held by an overlapping reservation are excluded in the query itself,
  // so the count and the page slice both already account for availability.
  if (excludeIds && excludeIds.length > 0) {
    conditions.push(notInArray(cars.id, excludeIds));
  }

  return and(...conditions);
}

/* Every order ends with id so it is a total order. Without that tiebreaker,
 * rows sharing a sort value — two cars at the same price — can shift between
 * pages and end up shown twice or skipped entirely. */
const SORTS: Record<CarSort, SQL[]> = {
  // Well-reviewed first, cheapest among equals. Cars with no reviews yet have
  // ratingAvg 0, so they sort below rated ones rather than above them.
  recommended: [
    desc(cars.ratingAvg),
    desc(cars.reviewCount),
    asc(cars.pricePerDay),
    asc(cars.id),
  ],
  "price-asc": [asc(cars.pricePerDay), asc(cars.id)],
  "price-desc": [desc(cars.pricePerDay), asc(cars.id)],
  rating: [desc(cars.ratingAvg), desc(cars.reviewCount), asc(cars.id)],
};

export interface CarPageOptions {
  sort?: CarSort;
  page?: number;
  pageSize?: number;
  /** Cars to leave out — used to drop those already booked for the window. */
  excludeIds?: string[];
}

export interface CarPage {
  cars: CarRow[];
  /** Cars matching the filters, ignoring the page slice. */
  total: number;
}

export const carRepository = {
  /** One page of the fleet, plus how many matched in total. The count runs
   *  against the same WHERE clause, so the two can never describe different
   *  sets. */
  async findPage(filters: CarFiltersInput = {}, options: CarPageOptions = {}): Promise<CarPage> {
    const db = getDb();
    const where = buildWhere(filters, options.excludeIds);

    const pageSize = Math.min(options.pageSize ?? DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);
    const page = Math.max(options.page ?? 1, 1);

    const [rows, totals] = await Promise.all([
      db
        .select()
        .from(cars)
        .where(where)
        .orderBy(...SORTS[options.sort ?? DEFAULT_CAR_SORT])
        .limit(pageSize)
        .offset((page - 1) * pageSize),
      db.select({ total: count() }).from(cars).where(where),
    ]);

    return { cars: rows, total: totals[0]?.total ?? 0 };
  },

  /** Every car matching the filters, unpaged — for callers that need the whole
   *  set, such as search suggestions. */
  async findMany(filters: CarFiltersInput = {}, sort: CarSort = DEFAULT_CAR_SORT) {
    return getDb()
      .select()
      .from(cars)
      .where(buildWhere(filters))
      .orderBy(...SORTS[sort]);
  },

  async findById(id: string): Promise<CarRow | null> {
    if (!UUID_PATTERN.test(id)) return null;
    const [car] = await getDb().select().from(cars).where(eq(cars.id, id)).limit(1);
    return car ?? null;
  },

  async findBySlug(slug: string): Promise<CarRow | null> {
    const [car] = await getDb().select().from(cars).where(eq(cars.slug, slug)).limit(1);
    return car ?? null;
  },

  /** Refresh every car's denormalised review aggregates. */
  recomputeAggregates,
};
