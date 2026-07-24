import Link from "next/link";
import Image from "next/image";
import { formatPrice } from "@/shared/utils";
import { carRating } from "@/frontend/lib/rating";
import type { Car } from "@/shared/types";

export function CarCard({ car, priority = false }: { car: Car; priority?: boolean }) {
  const { rating, reviews } = carRating(car.id);

  return (
    <div className="group relative flex h-full flex-col overflow-hidden rounded-lg border bg-white transition-shadow hover:shadow-md">
      <div className="relative aspect-[4/3] bg-white">
        <Image
          src={car.imageUrl}
          alt={`${car.make} ${car.model}`}
          fill
          className="object-contain p-6 transition-transform group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, (max-width: 1280px) 33vw, 20vw"
          priority={priority}
        />
        <span className="absolute left-3 top-3 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 ring-1 ring-emerald-200">
          Free cancellation
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-semibold">
              {/* Stretched link: makes the whole card clickable */}
              <Link href={`/cars/${car.id}`} className="after:absolute after:inset-0">
                {car.make} {car.model}
              </Link>
            </h3>
            <p className="text-sm text-gray-500">
              {car.year} · {car.transmission} · {car.seats} seats
            </p>
            <p className="mt-1 text-sm">
              <span aria-hidden className="text-amber-500">
                ★
              </span>{" "}
              <span className="font-medium">{rating.toFixed(1)}</span>{" "}
              <span className="text-gray-500">({reviews} trips)</span>
            </p>
          </div>
          <p className="text-right">
            <span className="font-semibold">{formatPrice(car.pricePerDay)}</span>
            <span className="block text-xs text-gray-500">per day</span>
          </p>
        </div>

        <div className="mt-auto flex gap-2 pt-2">
          <Link
            href={`/cars/${car.id}`}
            className="relative z-10 flex h-9 flex-1 items-center justify-center rounded-md border border-gray-300 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            Details
          </Link>
          <Link
            href={`/reservation?carId=${car.id}`}
            className="relative z-10 flex h-9 flex-1 items-center justify-center rounded-md bg-brand text-sm font-medium text-white transition-colors hover:bg-brand-dark"
          >
            Book now
          </Link>
        </div>
      </div>
    </div>
  );
}
