"use client";

import { BODY_TYPES, FUEL_TYPES } from "@/shared/constants";
import { FilterSelect } from "@/frontend/components/ui/filter-select";
import { SortSelect } from "@/frontend/components/features/cars/sort-select";
import { useListingParams } from "@/frontend/hooks/use-listing-params";
import {
  FLEET_SECTION_ID,
  priceFilterOptions as PRICE_OPTIONS,
} from "@/frontend/config/landing";

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

/** Options for an enum filter, with an "all" choice that clears it. */
function enumOptions(values: readonly string[], allLabel: string) {
  return [
    { value: "", label: allLabel },
    ...values.map((value) => ({ value, label: capitalize(value) })),
  ];
}

const BODY_OPTIONS = enumOptions(BODY_TYPES, "All body types");
const FUEL_OPTIONS = enumOptions(FUEL_TYPES, "All fuel types");

export function FilterBar() {
  // Returning to the fleet section keeps the grid in view when a filter
  // re-renders the page from the server.
  const { get, setParam, clear } = useListingParams({ hash: FLEET_SECTION_ID });

  const hasFilters = ["bodyType", "fuelType", "maxPrice", "sort"].some((key) => get(key));

  return (
    <div className="flex flex-wrap items-center gap-2">
      <FilterSelect
        label="Body type"
        value={get("bodyType")}
        onChange={(value) => setParam("bodyType", value)}
        options={BODY_OPTIONS}
      />

      <FilterSelect
        label="Fuel type"
        value={get("fuelType")}
        onChange={(value) => setParam("fuelType", value)}
        options={FUEL_OPTIONS}
      />

      <FilterSelect
        label="Maximum price per day"
        value={get("maxPrice")}
        onChange={(value) => setParam("maxPrice", value)}
        options={PRICE_OPTIONS}
      />

      {/* The same control the results page uses, rather than a second copy. */}
      <SortSelect hash={FLEET_SECTION_ID} labelled={false} />

      {hasFilters && (
        <button
          type="button"
          onClick={clear}
          className="h-10 rounded-md px-3 text-sm font-medium text-brand transition-colors hover:bg-brand/5"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}
