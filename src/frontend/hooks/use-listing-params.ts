"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { PAGE_PARAM } from "@/shared/lib/query";

/**
 * Reads and writes the listing's URL parameters — filters, sort, page.
 *
 * Shared by the filter bar and the sort control so one rule is applied in one
 * place: **changing anything but the page returns to page 1.** A filter or a
 * new order renumbers the results, so the page the renter is on may no longer
 * exist, and skipping that reset silently strands them on an empty page.
 */
export function useListingParams({ hash }: { hash?: string } = {}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function get(key: string) {
    return searchParams.get(key) ?? "";
  }

  function replace(params: URLSearchParams) {
    const query = params.toString();
    // Order matters: the fragment goes last, after any query string.
    const url = `${pathname}${query ? `?${query}` : ""}${hash ? `#${hash}` : ""}`;
    router.replace(url, { scroll: false });
  }

  function setParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());

    if (value) params.set(key, value);
    else params.delete(key);

    if (key !== PAGE_PARAM) params.delete(PAGE_PARAM);

    replace(params);
  }

  function clear() {
    replace(new URLSearchParams());
  }

  return { get, setParam, clear };
}
