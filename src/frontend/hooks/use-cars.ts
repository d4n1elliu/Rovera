"use client";

import { useEffect, useState } from "react";
import type { Car, CarFilters } from "@/shared/types";

export function useCars(filters: CarFilters = {}) {
  const [cars, setCars] = useState<Car[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const params = new URLSearchParams(
    Object.entries(filters).filter(([, v]) => v != null && v !== "") as [string, string][]
  ).toString();

  useEffect(() => {
    const controller = new AbortController();
    setIsLoading(true);

    fetch(`/api/cars${params ? `?${params}` : ""}`, { signal: controller.signal })
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setCars(json.data);
        else setError(json.error);
      })
      .catch((err) => {
        if (err.name !== "AbortError") setError("Failed to load cars");
      })
      .finally(() => setIsLoading(false));

    return () => controller.abort();
  }, [params]);

  return { cars, isLoading, error };
}
