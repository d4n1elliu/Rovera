import type { MetadataRoute } from "next";
import { getSitemapCars } from "@/backend/services/car.service";
import { siteConfig } from "@/frontend/config/site";

// Hourly, so new cars appear without a deploy.
export const revalidate = 3600;

const STATIC_ROUTES: { path: string; priority: number }[] = [
  { path: "/", priority: 1 },
  { path: "/cars", priority: 0.9 },
  { path: "/help", priority: 0.5 },
  { path: "/terms", priority: 0.3 },
  { path: "/privacy", priority: 0.3 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const entries: MetadataRoute.Sitemap = STATIC_ROUTES.map(({ path, priority }) => ({
    url: `${siteConfig.url}${path}`,
    lastModified: now,
    changeFrequency: path === "/cars" ? "daily" : "weekly",
    priority,
  }));

  // A DB outage drops the car entries, not the whole sitemap.
  const cars = await getSitemapCars().catch(() => []);
  for (const car of cars) {
    entries.push({
      url: `${siteConfig.url}/cars/${car.id}`,
      lastModified: car.updatedAt,
      changeFrequency: "weekly",
      priority: 0.7,
    });
  }

  return entries;
}
