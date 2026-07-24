"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/frontend/components/ui/input";
import { useDebounce } from "@/frontend/hooks/use-debounce";
import type { Car } from "@/shared/types";

export function SearchBar() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Car[]>([]);
  const debouncedQuery = useDebounce(query);

  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setSuggestions([]);
      return;
    }

    const controller = new AbortController();
    fetch(`/api/search?q=${encodeURIComponent(debouncedQuery)}`, { signal: controller.signal })
      .then((res) => res.json())
      .then((json) => setSuggestions(json.success ? json.data : []))
      .catch(() => {});

    return () => controller.abort();
  }, [debouncedQuery]);

  return (
    <div className="relative w-full max-w-md">
      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search by make or model…"
        aria-label="Search cars"
      />

      {suggestions.length > 0 && (
        <ul className="absolute z-10 mt-1 w-full overflow-hidden rounded-md border bg-white shadow-lg">
          {suggestions.map((car) => (
            <li key={car.id}>
              <button
                type="button"
                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50"
                onClick={() => {
                  setQuery("");
                  setSuggestions([]);
                  router.push(`/cars/${car.id}`);
                }}
              >
                {car.make} {car.model} ({car.year})
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
