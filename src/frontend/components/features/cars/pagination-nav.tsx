import Link from "next/link";
import type { Pagination } from "@/backend/services/car.service";
import { PAGE_PARAM } from "@/shared/lib/query";

/** Page numbers to render, with `null` standing in for a gap. Always shows
 *  the first and last page plus a window around the current one, so the
 *  control stays a fixed width however many pages there are. */
function pageItems(current: number, total: number): (number | null)[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const pages = new Set([1, total, current, current - 1, current + 1]);
  const shown = Array.from(pages)
    .filter((p) => p >= 1 && p <= total)
    .sort((a, b) => a - b);

  const items: (number | null)[] = [];
  let previous = 0;

  for (const page of shown) {
    if (page - previous > 1) items.push(null);
    items.push(page);
    previous = page;
  }

  return items;
}

const baseClass =
  "inline-flex h-9 min-w-9 items-center justify-center rounded-md border px-3 text-sm font-medium transition-colors";

export function PaginationNav({
  pagination,
  /** Current query string without `page`; the component adds it. */
  baseQuery,
  basePath,
  hash,
}: {
  pagination: Pagination;
  baseQuery?: string;
  basePath: string;
  /** Fragment to jump back to, without the "#". Used on the landing page so
   *  turning a page returns to the fleet rather than the top of the hero. */
  hash?: string;
}) {
  const { page, totalPages, hasPrevious, hasNext, total, pageSize } = pagination;

  // Nothing to navigate.
  if (totalPages <= 1) return null;

  function href(target: number) {
    const params = new URLSearchParams(baseQuery);
    // Page 1 is the canonical URL, so it carries no page parameter.
    if (target > 1) params.set(PAGE_PARAM, String(target));
    else params.delete(PAGE_PARAM);

    const query = params.toString();
    // Order matters: the fragment goes last, after any query string.
    return `${basePath}${query ? `?${query}` : ""}${hash ? `#${hash}` : ""}`;
  }

  const first = (page - 1) * pageSize + 1;
  const last = Math.min(page * pageSize, total);

  return (
    <nav aria-label="Pagination" className="flex flex-col items-center gap-3 pt-8">
      <div className="flex items-center gap-1">
        {hasPrevious ? (
          <Link
            href={href(page - 1)}
            rel="prev"
            className={`${baseClass} border-gray-300 text-gray-700 hover:bg-gray-50`}
          >
            Previous
          </Link>
        ) : (
          <span
            aria-disabled
            className={`${baseClass} border-gray-200 text-gray-300`}
          >
            Previous
          </span>
        )}

        {pageItems(page, totalPages).map((item, index) =>
          item === null ? (
            <span key={`gap-${index}`} aria-hidden className="px-1 text-gray-400">
              …
            </span>
          ) : item === page ? (
            <span
              key={item}
              aria-current="page"
              className={`${baseClass} border-brand bg-brand text-white`}
            >
              {item}
            </span>
          ) : (
            <Link
              key={item}
              href={href(item)}
              aria-label={`Page ${item}`}
              className={`${baseClass} border-gray-300 text-gray-700 hover:bg-gray-50`}
            >
              {item}
            </Link>
          )
        )}

        {hasNext ? (
          <Link
            href={href(page + 1)}
            rel="next"
            className={`${baseClass} border-gray-300 text-gray-700 hover:bg-gray-50`}
          >
            Next
          </Link>
        ) : (
          <span aria-disabled className={`${baseClass} border-gray-200 text-gray-300`}>
            Next
          </span>
        )}
      </div>

      <p className="text-sm text-gray-500">
        Showing {first}–{last} of {total} cars
      </p>
    </nav>
  );
}
