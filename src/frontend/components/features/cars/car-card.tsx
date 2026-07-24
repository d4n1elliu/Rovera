import Link from "next/link";
import Image from "next/image";
import { formatPrice } from "@/shared/utils";
import type { Car } from "@/shared/types";

export function CarCard({ car }: { car: Car }) {
  return (
    <div className="group overflow-hidden rounded-lg border bg-white transition-shadow hover:shadow-md">
      <div className="relative aspect-[4/3] bg-gray-100">
        <Image
          src={car.imageUrl}
          alt={`${car.make} ${car.model}`}
          fill
          className="object-cover transition-transform group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, 33vw"
        />
      </div>

      <div className="space-y-2 p-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold">
              {car.make} {car.model}
            </h3>
            <p className="text-sm text-gray-500">
              {car.year} · {car.transmission} · {car.seats} seats
            </p>
          </div>
          <p className="text-right">
            <span className="font-semibold">{formatPrice(car.pricePerDay)}</span>
            <span className="block text-xs text-gray-500">per day</span>
          </p>
        </div>

        <Link
          href={`/cars/${car.id}`}
          className="flex h-9 w-full items-center justify-center rounded-md bg-brand text-sm font-medium text-white transition-colors hover:bg-brand-dark"
        >
          View details
        </Link>
      </div>
    </div>
  );
}
