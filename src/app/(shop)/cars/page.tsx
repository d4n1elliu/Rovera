import type { Metadata } from "next";
import { searchAvailableCars } from "@/backend/services/car.service";
import { CarGrid } from "@/frontend/components/features/cars/car-grid";
import { PaginationNav } from "@/frontend/components/features/cars/pagination-nav";
import { SearchBar } from "@/frontend/components/features/cars/search-bar";
import { SearchEmptyState } from "@/frontend/components/features/cars/search-empty-state";
import { SearchSummary } from "@/frontend/components/features/cars/search-summary";
import { SortSelect } from "@/frontend/components/features/cars/sort-select";
import { carSearchQuery, parseCarSearch } from "@/shared/schemas/car-search.schema";
import { carListingSchema } from "@/shared/schemas/car.schema";
import { toDateInput } from "@/shared/lib/datetime";
import type { Quote } from "@/shared/lib/pricing";

export const metadata: Metadata = { title: "Browse cars" };

// Rendered per-request: results depend on live reservations for the searched
// window, so nothing here can be cached ahead of time.
export const dynamic = "force-dynamic";

export default async function CarsPage({
  searchParams,
}: {
  searchParams: Record<string, string | undefined>;
}) {
  const search = parseCarSearch(searchParams);
  // Ordering and paging are read separately from the search itself: they
  // change how results are shown, not which cars match.
  const listing = carListingSchema.parse(searchParams);
  const results = await searchAvailableCars(search, listing);

  // Rebuilt from the parsed search rather than the raw URL, so a parameter we
  // rejected is not passed on to the reservation form.
  const searchQuery = carSearchQuery({
    pickup: search.pickupAt ? toDateInput(search.pickupAt) : undefined,
    return: search.returnAt ? toDateInput(search.returnAt) : undefined,
    driverAge: String(search.driverAge),
    promo: search.promoCode ?? undefined,
  });

  // Everything except the page number, so a page link keeps the whole search.
  const pageQuery = new URLSearchParams(
    Object.entries(searchParams).filter(
      ([key, value]) => value && key !== "page"
    ) as [string, string][]
  ).toString();

  const quotes: Record<string, Quote> = {};
  for (const result of results.results) {
    if (result.quote) quotes[result.car.id] = result.quote;
  }

  return (
    <div className="w-full space-y-6 px-4 py-8 sm:px-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <SearchSummary search={search} results={results} />
        <SearchBar />
      </div>

      {results.results.length === 0 ? (
        <SearchEmptyState results={results} />
      ) : (
        <>
          <div className="flex justify-end">
            <SortSelect />
          </div>
          <CarGrid
            cars={results.results.map((result) => result.car)}
            quotes={quotes}
            searchQuery={searchQuery}
          />
          <PaginationNav
            pagination={results.pagination}
            baseQuery={pageQuery}
            basePath="/cars"
          />
        </>
      )}
    </div>
  );
}
