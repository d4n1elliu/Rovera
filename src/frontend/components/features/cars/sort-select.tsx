"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { sortOptions as SORT_OPTIONS } from "@/frontend/config/landing";

/** Sort control for the results list. Reads and writes the `sort` URL
 *  parameter, so the order is shareable and survives a reload — the server
 *  applies it in the query rather than reordering a page after the fact. */
export function SortSelect({ className }: { className?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function setSort(value: string) {
    const params = new URLSearchParams(searchParams.toString());

    if (value) params.set("sort", value);
    else params.delete("sort");

    // A new order renumbers everything, so page 3 of the old order is
    // meaningless — and may not exist. Always return to the first page.
    params.delete("page");

    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  return (
    <label className="flex items-center gap-2 text-sm text-gray-600">
      <span>Sort</span>
      <select
        aria-label="Sort results"
        value={searchParams.get("sort") ?? ""}
        onChange={(event) => setSort(event.target.value)}
        className={
          className ??
          "h-10 rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-700 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand-light/40"
        }
      >
        {SORT_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
