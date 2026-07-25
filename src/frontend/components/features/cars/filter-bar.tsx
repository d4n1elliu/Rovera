"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { BODY_TYPES, FUEL_TYPES } from "@/shared/constants";
import {
  priceFilterOptions as PRICE_OPTIONS,
  sortOptions as SORT_OPTIONS,
} from "@/frontend/config/landing";

const selectClass =
  "h-10 rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-700 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand-light/40";

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function FilterBar() {
  const router = useRouter();
  const searchParams = useSearchParams();

  function setParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    const query = params.toString();
    router.replace(query ? `/?${query}` : "/", { scroll: false });
  }

  const hasFilters = ["bodyType", "fuelType", "maxPrice", "sort"].some((key) =>
    searchParams.get(key)
  );

  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        aria-label="Body type"
        value={searchParams.get("bodyType") ?? ""}
        onChange={(e) => setParam("bodyType", e.target.value)}
        className={selectClass}
      >
        <option value="">All body types</option>
        {BODY_TYPES.map((type) => (
          <option key={type} value={type}>
            {capitalize(type)}
          </option>
        ))}
      </select>

      <select
        aria-label="Fuel type"
        value={searchParams.get("fuelType") ?? ""}
        onChange={(e) => setParam("fuelType", e.target.value)}
        className={selectClass}
      >
        <option value="">All fuel types</option>
        {FUEL_TYPES.map((type) => (
          <option key={type} value={type}>
            {capitalize(type)}
          </option>
        ))}
      </select>

      <select
        aria-label="Maximum price per day"
        value={searchParams.get("maxPrice") ?? ""}
        onChange={(e) => setParam("maxPrice", e.target.value)}
        className={selectClass}
      >
        {PRICE_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      <select
        aria-label="Sort results"
        value={searchParams.get("sort") ?? ""}
        onChange={(e) => setParam("sort", e.target.value)}
        className={selectClass}
      >
        {SORT_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      {hasFilters && (
        <button
          type="button"
          onClick={() => router.replace("/", { scroll: false })}
          className="h-10 rounded-md px-3 text-sm font-medium text-brand transition-colors hover:bg-brand/5"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}
