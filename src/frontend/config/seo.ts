import type { Metadata } from "next";
import { siteConfig } from "@/frontend/config/site";

interface PageSeo {
  /** Strings get the "%s | Rovera" template; `{ absolute }` opts out. */
  title: string | { absolute: string };
  description: string;
  /** Canonical path and og:url, e.g. "/cars". */
  path: string;
  /** Per-visitor pages: noindex and no canonical. */
  noindex?: boolean;
}

// Branded card from app/opengraph-image.tsx. Listed explicitly because a page
// that sets its own openGraph block loses the file-based image.
export const OG_IMAGE = {
  url: "/opengraph-image",
  width: 1200,
  height: 630,
  alt: "Rovera – car rental, booked in minutes",
};

// Every page re-declares openGraph/twitter: Next replaces rather than merges
// them, and an inherited block would carry the root layout's title.
export function pageMetadata({ title, description, path, noindex = false }: PageSeo): Metadata {
  return {
    title,
    description,
    alternates: noindex ? undefined : { canonical: path },
    robots: noindex ? { index: false, follow: false } : { index: true, follow: true },
    openGraph: {
      type: "website",
      siteName: siteConfig.name,
      locale: siteConfig.seo.locale,
      url: path,
      images: [OG_IMAGE],
    },
    twitter: { card: "summary_large_image", images: [OG_IMAGE] },
  };
}
