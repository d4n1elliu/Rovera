import Link from "next/link";
import type { ReactNode } from "react";
import type { CarSearchResults } from "@/backend/services/car.service";
import type { CarSearch } from "@/shared/schemas/car-search.schema";
import { billableDays } from "@/shared/lib/pricing";
import { YOUNG_DRIVER_AGE } from "@/shared/constants";
import { formatDateTime, pluralise } from "@/shared/utils";

function Chip({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
      {children}
    </span>
  );
}

/** The state of the current search: how many cars it returned, over what dates,
 *  and under what terms. Rendered above the results so the renter can see their
 *  search was understood before reading a single card. */
export function SearchSummary({
  search,
  results,
}: {
  search: CarSearch;
  results: CarSearchResults;
}) {
  const { pickupAt, returnAt } = search;
  const days = results.hasWindow && pickupAt && returnAt ? billableDays(pickupAt, returnAt) : 0;

  const heading = results.hasWindow
    ? results.available === 0
      ? "No cars available"
      : `${pluralise(results.available, "car")} available`
    : `${pluralise(results.available, "car")} in the fleet`;

  return (
    <div>
      <h1 className="text-3xl font-bold">{heading}</h1>

      {results.hasWindow && pickupAt && returnAt ? (
        <p className="mt-1 text-gray-600">
          {formatDateTime(pickupAt)} — {formatDateTime(returnAt)} · {pluralise(days, "day")}
        </p>
      ) : (
        <p className="mt-1 text-gray-600">
          {search.windowError
            ? `${search.windowError.message} — showing the full fleet instead.`
            : "Pick your dates to see availability and totals."}
        </p>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {search.pickupLocation && (
          <Chip>
            {search.dropoffLocation && search.dropoffLocation !== search.pickupLocation
              ? `${search.pickupLocation} → ${search.dropoffLocation}`
              : search.pickupLocation}
          </Chip>
        )}
        {results.hasWindow && (
          <Chip>
            Driver {search.driverAge}
            {search.driverAge >= YOUNG_DRIVER_AGE ? "+" : ""}
          </Chip>
        )}
        {results.hasWindow && search.promoCode && <Chip>{search.promoCode}</Chip>}
        <Link
          href="/"
          className="text-sm font-medium text-brand underline-offset-4 hover:underline"
        >
          Change search
        </Link>
      </div>

      {results.unavailable > 0 && results.available > 0 && (
        <p className="mt-3 text-sm text-gray-500">
          {pluralise(results.unavailable, "car")} of {results.matched} already booked for these
          dates.
        </p>
      )}
    </div>
  );
}
