import { Suspense } from "react";
import Image from "next/image";
import { getCars } from "@/backend/services/car.service";
import { BookingWidget } from "@/frontend/components/features/booking/booking-widget";
import { CarGrid } from "@/frontend/components/features/cars/car-grid";
import { FilterBar } from "@/frontend/components/features/cars/filter-bar";
import { HeroCarousel } from "@/frontend/components/features/marketing/hero-carousel";
import { Eyebrow } from "@/frontend/components/ui/eyebrow";
import { PillLink } from "@/frontend/components/ui/pill-link";
import {
  FLEET_SECTION_ID,
  aboutContent,
  fleetContent,
  heroContent,
  stats,
  testimonialsContent,
} from "@/frontend/config/landing";
import { carRating } from "@/frontend/lib/rating";
import type { Car } from "@/shared/types";

// Rendered per-request: the listing reads live availability from the DB.
export const dynamic = "force-dynamic";

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
    <div>
      {/* Hero — full-bleed photographic background */}
      <section className="relative bg-brand-navy text-white">
        <HeroCarousel />
        {/* Dark overlay for text legibility */}
        <div aria-hidden className="absolute inset-0 bg-brand-navy/50" />
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-brand-navy/90 to-transparent"
        />

        <div className="relative flex min-h-[70vh] flex-col px-6 pt-10 sm:px-10 lg:px-14 lg:pt-14">
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
              {heroContent.headline[0]}
              <br />
              {heroContent.headline[1]}
            </h1>
            <p className="mt-5 text-lg text-blue-100">{heroContent.subline}</p>
          </div>

          <div className="absolute inset-x-0 top-1/2 z-10 -translate-y-1/2 text-center">
            <PillLink href={heroContent.cta.href} variant="ghost">
              {heroContent.cta.label}
            </PillLink>
          </div>
        </div>
      </section>

      {/* Booking search — its own band on mobile, straddling the hero seam on sm+ */}
      <div className="relative z-10 bg-sky-50 px-6 py-8 sm:-mt-10 sm:bg-transparent sm:px-10 sm:py-0 lg:px-14">
        <BookingWidget />
      </div>

      {/* About — light mint */}
      <section className="bg-sky-50 px-6 pb-16 pt-16 sm:px-10 sm:pt-24 lg:px-14">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <Eyebrow>{aboutContent.eyebrow}</Eyebrow>
            <h2 className="mt-4 text-4xl font-extrabold tracking-tight text-gray-900">
              {aboutContent.heading}
            </h2>
            <p className="mt-5 max-w-lg text-gray-600">{aboutContent.body}</p>
            <PillLink href={aboutContent.cta.href} variant="accent" className="mt-8">
              {aboutContent.cta.label}
            </PillLink>
          </div>

          <div className="flex items-center justify-center p-8">
            <Image
              src={aboutContent.image.src}
              alt={aboutContent.image.alt}
              width={aboutContent.image.width}
              height={aboutContent.image.height}
              quality={90}
              className="h-auto w-full max-w-[637px] object-contain mix-blend-multiply"
            />
          </div>
        </div>
      </section>

      {/* Fleet — white */}
      <section id={FLEET_SECTION_ID} className="scroll-mt-16 bg-white px-6 py-16 sm:px-10 lg:px-14">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Eyebrow>{fleetContent.eyebrow}</Eyebrow>
            <h2 className="mt-4 text-4xl font-extrabold tracking-tight text-gray-900">
              {fleetContent.heading}
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
      <section aria-label="Rovera in numbers" className="bg-brand-navy px-6 py-14 sm:px-10 lg:px-14">
        <div className="grid grid-cols-2 gap-8 text-center md:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label}>
              <p className="text-4xl font-extrabold text-accent">{stat.value}</p>
              <p className="mt-2 text-sm text-blue-200">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials — light mint */}
      <section aria-label={testimonialsContent.eyebrow} className="bg-sky-50 px-6 py-16 sm:px-10 lg:px-14">
        <Eyebrow>{testimonialsContent.eyebrow}</Eyebrow>
        <h2 className="mt-4 text-4xl font-extrabold tracking-tight text-gray-900">
          {testimonialsContent.heading}
        </h2>
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          {testimonialsContent.items.map((t) => (
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
