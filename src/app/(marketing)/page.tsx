import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { getCars } from "@/backend/services/car.service";
import { BookingWidget } from "@/frontend/components/features/booking/booking-widget";
import { CarGrid } from "@/frontend/components/features/cars/car-grid";
import { FilterBar } from "@/frontend/components/features/cars/filter-bar";
import { HeroCarousel } from "@/frontend/components/features/marketing/hero-carousel";
import { carRating } from "@/frontend/lib/rating";
import type { Car } from "@/shared/types";

// Rendered per-request: the listing reads live availability from the DB.
export const dynamic = "force-dynamic";

const STATS = [
  { value: "100+", label: "happy clients" },
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

function Eyebrow({ children, dark = false }: { children: React.ReactNode; dark?: boolean }) {
  return (
    <p
      className={`flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.25em] ${
        dark ? "text-emerald-300" : "text-gray-700"
      }`}
    >
      <span aria-hidden className="inline-block h-3 w-3 bg-emerald-300" />
      {children}
    </p>
  );
}

export default async function HomePage({ searchParams }: { searchParams: HomeSearchParams }) {
  const { sort, ...filters } = searchParams;
  const cars = sortCars((await getCars(filters)) as unknown as Car[], sort);

  return (
    <div>
      {/* Hero — full-bleed photographic background */}
      <section className="relative bg-[#0a1730] text-white">
        <HeroCarousel />
        {/* Dark overlay for text legibility */}
        <div
          aria-hidden
          className="absolute inset-0 bg-[#0a1730]/50"
        />
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-[#0a1730]/90 to-transparent"
        />

        <div className="relative flex min-h-[70vh] flex-col px-6 pt-10 sm:px-10 lg:px-14 lg:pt-14">
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="text-5xl font-extrabold tracking-tight sm:text-6xl">
              Drive the future
              <br />
              with Rovera.
            </h1>
            <p className="mt-5 text-lg text-blue-100">No counters. No hidden fees.</p>
          </div>

          <div className="absolute inset-x-0 top-1/2 z-10 -translate-y-1/2 text-center">
            <a
              href="#fleet"
              className="inline-flex h-12 items-center justify-center rounded-full border border-white/60 bg-transparent px-8 text-sm font-semibold text-white transition-colors hover:border-emerald-300 hover:bg-emerald-300 hover:text-gray-900"
            >
              Book a car
            </a>
          </div>

          <div className="relative z-10 mt-auto translate-y-1/2">
            <BookingWidget />
          </div>
        </div>
      </section>

      {/* About — light mint */}
      <section className="bg-sky-50 px-6 pb-16 pt-24 sm:px-10 lg:px-14">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <Eyebrow>Renting made simple</Eyebrow>
            <h2 className="mt-4 text-4xl font-extrabold tracking-tight text-gray-900">
              We are Rovera
            </h2>
            <p className="mt-5 max-w-lg text-gray-600">
              Book online, pick up in five Australian cities, and drive. Insurance, free
              cancellation, and 24/7 support included.
            </p>
            <Link
              href="/help"
              className="mt-8 inline-flex h-12 items-center justify-center rounded-full bg-emerald-300 px-8 text-sm font-semibold text-gray-900 transition-colors hover:bg-emerald-200"
            >
              Read more
            </Link>
          </div>

          <div className="flex items-center justify-center p-8">
            <Image
              src="/car_images/2022-Tesla-Model-3-Electric.png"
              alt="Tesla Model 3 from the Rovera fleet"
              width={637}
              height={405}
              quality={90}
              className="h-auto w-full max-w-[637px] object-contain mix-blend-multiply"
            />
          </div>
        </div>
      </section>

      {/* Fleet — white */}
      <section id="fleet" className="scroll-mt-16 bg-white px-6 py-16 sm:px-10 lg:px-14">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Eyebrow>Our fleet</Eyebrow>
            <h2 className="mt-4 text-4xl font-extrabold tracking-tight text-gray-900">
              Available cars
            </h2>
          </div>
          <Suspense fallback={null}>
            <FilterBar />
          </Suspense>
        </div>
        <div className="mt-8">
          <CarGrid cars={cars} />
        </div>
      </section>

      {/* Stats — dark band */}
      <section aria-label="Rovera in numbers" className="bg-[#0a1730] px-6 py-14 sm:px-10 lg:px-14">
        <div className="grid grid-cols-2 gap-8 text-center md:grid-cols-4">
          {STATS.map((stat) => (
            <div key={stat.label}>
              <p className="text-4xl font-extrabold text-emerald-300">{stat.value}</p>
              <p className="mt-2 text-sm text-blue-200">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials — light mint */}
      <section aria-label="What clients say" className="bg-sky-50 px-6 py-16 sm:px-10 lg:px-14">
        <Eyebrow>What clients say</Eyebrow>
        <h2 className="mt-4 text-4xl font-extrabold tracking-tight text-gray-900">
          Trusted on every trip
        </h2>
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          {TESTIMONIALS.map((t) => (
            <figure key={t.author} className="rounded-3xl bg-white p-6 shadow-sm">
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
