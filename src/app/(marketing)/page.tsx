import { getCars } from "@/backend/services/car.service";
import { CarGrid } from "@/frontend/components/features/cars/car-grid";
import { SearchBar } from "@/frontend/components/features/cars/search-bar";
import { siteConfig } from "@/frontend/config/site";
import type { Car } from "@/shared/types";

// Rendered per-request: the listing reads live availability from the DB.
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const cars = (await getCars()) as unknown as Car[];

  return (
    <div className="space-y-10">
      <section className="space-y-4 py-8 text-center">
        <h1 className="text-4xl font-bold tracking-tight">{siteConfig.description}</h1>
        <p className="text-gray-500">
          Browse our fleet and book in minutes. No hidden fees, free cancellation.
        </p>
        <div className="flex justify-center">
          <SearchBar />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Available cars</h2>
        <CarGrid cars={cars} />
      </section>
    </div>
  );
}
