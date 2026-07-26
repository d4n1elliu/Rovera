"use client";

import { FilterSelect } from "@/frontend/components/ui/filter-select";
import { useListingParams } from "@/frontend/hooks/use-listing-params";
import { sortOptions as SORT_OPTIONS } from "@/frontend/config/landing";

/** Sort control for a listing. Reads and writes the `sort` URL parameter, so
 *  the order is shareable and survives a reload — the server applies it in the
 *  query rather than reordering an already-fetched page. */
export function SortSelect({ hash, labelled = true }: { hash?: string; labelled?: boolean }) {
  const { get, setParam } = useListingParams({ hash });

  const select = (
    <FilterSelect
      label="Sort results"
      value={get("sort")}
      onChange={(value) => setParam("sort", value)}
      options={SORT_OPTIONS}
    />
  );

  if (!labelled) return select;

  return (
    <label className="flex items-center gap-2 text-sm text-gray-600">
      <span>Sort</span>
      {select}
    </label>
  );
}
