import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
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
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-sky-100 via-slate-50 to-blue-100 px-6 py-12 sm:px-10 lg:px-14 lg:py-16">
        {/* Soft decorative glows */}
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-brand/10 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-32 -left-24 h-80 w-80 rounded-full bg-sky-300/20 blur-3xl"
        />

        <div className="relative grid items-center gap-10 lg:grid-cols-[1.1fr_1fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand">
              Car rental, uncomplicated
            </p>
            <h1 className="mt-4 text-5xl font-extrabold tracking-tight text-gray-900 sm:text-6xl">
              Rent a car
              <br />
              in minutes.
            </h1>
            <p className="mt-5 max-w-md text-lg text-gray-600">
              No counters, no hidden fees. Insurance and free cancellation up to 24 hours before
              pickup including with every booking.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <a
                href="#fleet"
                className="inline-flex h-12 items-center justify-center rounded-full bg-brand px-8 text-sm font-semibold text-white transition-colors hover:bg-brand-dark"
              >
                Book a car
              </a>
              <Link
                href="/cars"
                className="inline-flex h-12 items-center justify-center rounded-full border border-gray-300 bg-white/60 px-8 text-sm font-semibold text-gray-800 backdrop-blur transition-colors hover:bg-white"
              >
                Browse the fleet
              </Link>
            </div>

            <p className="mt-6 text-sm text-gray-600">
              <span aria-hidden className="text-amber-500">
                ★★★★★
              </span>{" "}
              <span className="font-semibold text-gray-900">4.8</span> from 2,300+ rentals
            </p>
          </div>

          <div className="relative hidden lg:block">
            <div
              aria-hidden
              className="absolute inset-x-8 bottom-6 h-10 rounded-full bg-gray-900/10 blur-2xl"
            />
            <Image
              src="/car_images/2021-Mercedes-Benz-C-class-cabriolet-convertible.png"
              alt="Mercedes-Benz C-Class Cabriolet available to rent"
              width={720}
              height={420}
              className="relative w-full object-contain mix-blend-multiply"
              priority
            />
          </div>
        </div>

        <div className="relative mt-10">
          <BookingWidget />
        </div>

        <ul className="relative mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-600">
          {TRUST_CHIPS.map((chip) => (
            <li key={chip} className="flex items-center gap-1.5">
              <span aria-hidden className="text-emerald-600">
                ✓
              </span>
              {chip}
            </li>
          ))}
        </ul>
      </section>

      {/* Fleet */}
      <section id="fleet" className="scroll-mt-20 space-y-4">
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
