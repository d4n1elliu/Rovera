import type { MetadataRoute } from "next";
import { siteConfig } from "@/frontend/config/site";

// API routes and per-visitor pages (also tagged noindex) are kept out.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/account", "/rentals", "/checkout", "/confirmation", "/reservation"],
    },
    sitemap: `${siteConfig.url}/sitemap.xml`,
  };
}
