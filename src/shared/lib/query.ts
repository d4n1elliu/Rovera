/** The URL parameter carrying the current page of a listing. Named once so the
 *  pages, the pagination control and the listing hook cannot disagree on it. */
export const PAGE_PARAM = "page";

/**
 * Re-encode search parameters, dropping empty values and the given keys.
 *
 * Both listings build a "base" query for their pagination links: the current
 * search minus the page number, so a page link keeps the filters and the sort
 * while replacing only the page.
 */
export function queryWithout(
  searchParams: Record<string, string | undefined>,
  ...omit: string[]
) {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(searchParams)) {
    if (!value || omit.includes(key)) continue;
    params.set(key, value);
  }

  return params.toString();
}
