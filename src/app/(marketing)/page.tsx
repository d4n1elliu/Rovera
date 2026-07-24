import { Suspense } from "react";
import { getCars } from "@/backend/services/car.service";
import { BookingWidget } from "@/frontend/components/features/booking/booking-widget";
import { CarGrid } from "@/frontend/components/features/cars/car-grid";
import { FilterBar } from "@/frontend/components/features/cars/filter-bar";
import { carRating } from "@/frontend/lib/rating";
import type { Car } from "@/shared/types";

// Rendered per-request: the listing reads live availability from the DB.
export const dynamic = "force-dynamic";

const TRUST_CHIPS = [
  "Free cancellation",
  "Insurance included",
  "24/7 support",
  "Instant confirmation",
];

const STATS = [
  { value: "2,300+", label: "rentals completed" },
  { value: "4.8 ★", label: "average rating" },
  { value: "5", label: "cities served" },
  { value: "24/7", label: "roadside support" },
];

const TESTIMONIALS = [
  {
    quote:
      "Booked at 11pm, picked the car up at 7 the next morning. Zero paperwork at pickup and the deposit came back the same week.",
    author: "Sarah M.",
    detail: "Rented a Toyota Corolla",
  },
  {
    quote:
      "My flight got cancelled and I had to push the trip by two days. Cancelling and rebooking took about a minute — no fees, no phone calls.",
    author: "James T.",
    detail: "Rented a Tesla Model 3",
  },
];

interface HomeSearchParams {
  bodyType?: string;
  fuelType?: string;
  maxPrice?: string;
  sort?: string;
}

function sortCars(cars: Car[], sort?: string) {
  switch (sort) {
    case "price-asc":
      return [...cars].sort((a, b) => a.pricePerDay - b.pricePerDay);
    case "price-desc":
      return [...cars].sort((a, b) => b.pricePerDay - a.pricePerDay);
    case "rating":
      return [...cars].sort((a, b) => carRating(b.id).rating - carRating(a.id).rating);
    default:
      return cars;
  }
}

export default async function HomePage({ searchParams }: { searchParams: HomeSearchParams }) {
  const { sort, ...filters } = searchParams;
  const cars = sortCars((await getCars(filters)) as unknown as Car[], sort);

  return (
    <div className="space-y-14">
      {/* Hero */}
      <section className="overflow-hidden rounded-2xl bg-gradient-to-br from-[#0b1c3f] via-brand-dark to-brand px-6 py-10 text-white sm:px-10 sm:py-14">
        <div className="max-w-2xl space-y-4">
          <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm ring-1 ring-white/20">
            <span aria-hidden className="text-amber-400">
              ★★★★★
            </span>
            <span>4.8 from 2,300+ rentals</span>
          </p>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Rent a car in minutes.
            <br />
            No counters, no hidden fees.
          </h1>
          <p className="text-lg text-blue-100">
            Pick your dates, choose a car, and drive. Every booking includes insurance and free
            cancellation up to 24 hours before pickup.
          </p>
        </div>

        <div className="mt-8">
          <BookingWidget />
        </div>

        <ul className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm text-blue-100">
          {TRUST_CHIPS.map((chip) => (
            <li key={chip} className="flex items-center gap-1.5">
              <span aria-hidden className="text-emerald-400">
                ✓
              </span>
              {chip}
            </li>
          ))}
        </ul>
      </section>

      {/* Fleet */}
      <section id="fleet" className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold">Available cars</h2>
            <p className="text-sm text-gray-500">
              Every car comes with insurance included and free cancellation.
            </p>
          </div>
          <Suspense fallback={null}>
            <FilterBar />
          </Suspense>
        </div>
        <CarGrid cars={cars} />
      </section>

      {/* Social proof */}
      <section aria-label="Why renters choose Rovera" className="space-y-8">
        <div className="grid grid-cols-2 gap-6 rounded-2xl border bg-white p-8 text-center md:grid-cols-4">
          {STATS.map((stat) => (
            <div key={stat.label}>
              <p className="text-3xl font-bold text-brand-dark">{stat.value}</p>
              <p className="mt-1 text-sm text-gray-500">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {TESTIMONIALS.map((t) => (
            <figure key={t.author} className="rounded-2xl border bg-white p-6">
              <p aria-hidden className="text-amber-500">
                ★★★★★
              </p>
              <blockquote className="mt-3 text-gray-700">“{t.quote}”</blockquote>
              <figcaption className="mt-4 text-sm">
                <span className="font-semibold">{t.author}</span>
                <span className="text-gray-500"> · {t.detail}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>
    </div>
  );
}
