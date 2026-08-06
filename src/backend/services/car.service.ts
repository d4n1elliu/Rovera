import "server-only";
import { carRepository } from "@/backend/repositories/car.repository";
import {
  promoCodeRepository,
  toPromotion,
} from "@/backend/repositories/promo-code.repository";
import { reservationRepository } from "@/backend/repositories/reservation.repository";
import { toCar } from "@/backend/lib/serialize";
import {
  carFiltersSchema,
  carQuerySchema,
  type CarFiltersInput,
} from "@/shared/schemas/car.schema";
import type { CarSearch } from "@/shared/schemas/car-search.schema";
import { quoteRental, type Quote } from "@/shared/lib/pricing";
import type { CarSort } from "@/shared/constants";
import type { Car } from "@/shared/types";

/** Where a page sits in the full result set, so the UI can render controls
 *  without recomputing any of it. */
export interface Pagination {
  page: number;
  pageSize: number;
  /** Cars matching the filters, across every page. */
  total: number;
  totalPages: number;
  hasPrevious: boolean;
  hasNext: boolean;
}

function paginate(page: number, pageSize: number, total: number): Pagination {
  // At least one page, so an empty result still renders as "page 1 of 1"
  // rather than "page 1 of 0".
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  return {
    page,
    pageSize,
    total,
    totalPages,
    hasPrevious: page > 1,
    hasNext: page < totalPages,
  };
}

export interface CarListing {
  cars: Car[];
  pagination: Pagination;
}

/** One page of the fleet, filtered and ordered. */
export async function getCars(rawQuery: unknown = {}): Promise<CarListing> {
  const { sort, page, pageSize, ...filters } = carQuerySchema.parse(rawQuery);
  const { cars, total } = await carRepository.findPage(filters, { sort, page, pageSize });

  return { cars: cars.map(toCar), pagination: paginate(page, pageSize, total) };
}

export async function getCarById(id: string) {
  const car = await carRepository.findById(id);
  if (!car) throw new Error(`Car not found: ${id}`);
  return toCar(car);
}

export async function searchCars(query: string) {
  if (!query.trim()) return [];
  const filters: CarFiltersInput = carFiltersSchema.parse({ query });
  const cars = await carRepository.findMany(filters);
  return cars.map(toCar);
}

export interface CarSearchResult {
  car: Car;
  /** What this car costs for the searched window, including the young-driver
   *  surcharge and any promotion. Null when no dates were searched. */
  quote: Quote | null;
}

export interface CarSearchResults {
  results: CarSearchResult[];
  /** Cars matching the filters, before availability is considered. */
  matched: number;
  /** Cars matching the filters and free for the window, across every page. */
  available: number;
  /** Of those matched, how many are already booked out. */
  unavailable: number;
  /** False when the search carried no usable dates, in which case the counts
   *  describe the fleet rather than availability. */
  hasWindow: boolean;
  pagination: Pagination;
}

/** Cars a renter can actually book for their search, priced for the driver age
 *  and promo code they searched with.
 *
 *  Availability is resolved before the page is cut, not after: cars held by an
 *  overlapping reservation are excluded inside the query itself. Filtering a
 *  page after fetching it would return short pages and a total that counted
 *  cars the renter cannot book. */
export async function searchAvailableCars(
  search: CarSearch,
  listing: { sort: CarSort; page: number; pageSize: number }
): Promise<CarSearchResults> {
  const { sort, page, pageSize } = listing;
  const { pickupAt, returnAt } = search;

  if (!pickupAt || !returnAt) {
    const { cars, total } = await carRepository.findPage(search.filters, {
      sort,
      page,
      pageSize,
    });

    return {
      results: cars.map((car) => ({ car: toCar(car), quote: null })),
      matched: total,
      available: total,
      unavailable: 0,
      hasWindow: false,
      pagination: paginate(page, pageSize, total),
    };
  }

  const [booked, promoRow] = await Promise.all([
    reservationRepository.findBookedCarIds(pickupAt, returnAt),
    // Resolved from the DB once per page, so shown totals match what booking charges.
    search.promoCode ? promoCodeRepository.findUsableByCode(search.promoCode) : null,
  ]);
  const promotion = promoRow ? toPromotion(promoRow) : null;

  const [{ cars, total: available }, matched] = await Promise.all([
    carRepository.findPage(search.filters, { sort, page, pageSize, excludeIds: booked }),
    // The same filters without the availability exclusion, so the page can say
    // how many matching cars were taken rather than only how many are left.
    // pageSize 1 because only the count is used.
    carRepository.findPage(search.filters, { page: 1, pageSize: 1 }),
  ]);

  const results = cars.map((doc) => {
    const car = toCar(doc);
    return {
      car,
      quote: quoteRental({
        pricePerDay: car.pricePerDay,
        pickupAt,
        returnAt,
        driverAge: search.driverAge,
        promotion,
      }),
    };
  });

  return {
    results,
    matched: matched.total,
    available,
    unavailable: matched.total - available,
    hasWindow: true,
    pagination: paginate(page, pageSize, available),
  };
}
