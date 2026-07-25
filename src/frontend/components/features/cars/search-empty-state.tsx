import Link from "next/link";
import type { CarSearchResults } from "@/backend/services/car.service";
import { MAX_RENTAL_DAYS } from "@/shared/constants";

/** Shown in place of the grid when a search returns nothing. Says which of the
 *  two reasons applies — booked out, or filtered out — because the way back is
 *  different for each. */
export function SearchEmptyState({ results }: { results: CarSearchResults }) {
  const bookedOut = results.hasWindow && results.matched > 0;

  const bookedOutDetail =
    results.matched === 1
      ? "The only car matching your search is already reserved for part of your window."
      : `All ${results.matched} cars matching your search are already reserved for part of your window.`;

  return (
    <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-6 py-12 text-center">
      <p className="text-lg font-semibold text-gray-900">
        {bookedOut ? "Every car is booked for those dates" : "No cars match your filters"}
      </p>

      <p className="mx-auto mt-2 max-w-md text-sm text-gray-600">
        {bookedOut
          ? `${bookedOutDetail} Shifting the pickup by a day usually frees one up — rentals can run up to ${MAX_RENTAL_DAYS} days.`
          : "Try widening the price range or choosing a different body or fuel type."}
      </p>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/"
          className="inline-flex h-10 items-center rounded-md bg-brand px-4 text-sm font-semibold text-white transition-colors hover:bg-brand-dark"
        >
          Change your dates
        </Link>
        <Link
          href="/cars"
          className="inline-flex h-10 items-center rounded-md border border-gray-300 bg-white px-4 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
        >
          Browse the whole fleet
        </Link>
      </div>
    </div>
  );
}
