import "server-only";
import { carRepository } from "@/backend/repositories/car.repository";
import { reservationRepository } from "@/backend/repositories/reservation.repository";
import { carFiltersSchema, type CarFiltersInput } from "@/shared/schemas/car.schema";
import type { CarSearch } from "@/shared/schemas/car-search.schema";
import { quoteRental, type Quote } from "@/shared/lib/pricing";
import type { Car } from "@/shared/types";

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
  /** Of those, how many are free for the searched window. */
  available: number;
  /** Of those, how many are already booked out. */
  unavailable: number;
  /** False when the search carried no usable dates, in which case the counts
   *  describe the fleet rather than availability. */
  hasWindow: boolean;
}

/** Cars a renter can actually book for their search, priced for the driver age
 *  and promo code they searched with. Availability is resolved in a single
 *  query against overlapping reservations. */
export async function searchAvailableCars(search: CarSearch): Promise<CarSearchResults> {
  const cars = (await carRepository.findMany(search.filters)) as unknown as Car[];
  const { pickupAt, returnAt } = search;

  if (!pickupAt || !returnAt) {
    return {
      results: cars.map((car) => ({ car, quote: null })),
      matched: cars.length,
      available: cars.length,
      unavailable: 0,
      hasWindow: false,
    };
  }

  const booked = await reservationRepository.findBookedCarIds(pickupAt, returnAt);
  const results = cars
    .filter((car) => !booked.has(car.id))
    .map((car) => ({
      car,
      quote: quoteRental({
        pricePerDay: car.pricePerDay,
        pickupAt,
        returnAt,
        driverAge: search.driverAge,
        promoCode: search.promoCode,
      }),
    }));

  return {
    results,
    matched: cars.length,
    available: results.length,
    unavailable: cars.length - results.length,
    hasWindow: true,
  };
}
