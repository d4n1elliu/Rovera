"use client";

import { useEffect, useState } from "react";
import { siteConfig } from "@/frontend/config/site";

const STORAGE_KEY = "rovera:portfolio-banner-dismissed";

/* Sits above the sticky header, so it scrolls away and never overlaps it.
 * Always server-rendered; a remembered dismissal only takes effect after hydration. */
export function PortfolioBanner() {
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(STORAGE_KEY) === "1") setDismissed(true);
    } catch {}
  }, []);

  function dismiss() {
    setDismissed(true);
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {}
  }

  if (dismissed) return null;

  return (
    <div role="region" aria-label="Portfolio project notice" className="border-b border-white/10 bg-brand-navy">
      <div className="relative mx-auto flex min-h-9 max-w-5xl items-center justify-center px-10 py-2 text-center text-xs leading-snug text-blue-100 sm:text-[13px]">
        <p>
          {siteConfig.portfolio.notice}{" "}
          <a
            href={siteConfig.portfolio.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-accent underline underline-offset-2 hover:text-accent-light"
          >
            View source
          </a>
        </p>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss notice"
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-lg leading-none text-blue-200 hover:text-white"
        >
          ×
        </button>
      </div>
    </div>
  );
}
