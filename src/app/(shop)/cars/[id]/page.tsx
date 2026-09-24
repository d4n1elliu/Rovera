import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCarById } from "@/backend/services/car.service";
import { pageMetadata } from "@/frontend/config/seo";
import { formatPrice } from "@/shared/utils";
import type { Car } from "@/shared/types";

type Params = { params: { id: string } };

function carName(car: Car) {
  return `${car.year} ${car.make} ${car.model}`;
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const car = await getCarById(params.id).catch(() => null);
  if (!car) return pageMetadata({ title: "Car not found", description: "", path: "/cars", noindex: true });

  const name = carName(car);
  const base = pageMetadata({
    title: name,
    description: `Rent the ${name} from ${formatPrice(car.pricePerDay)} per day. ${car.seats} seats, ${car.transmission}, ${car.fuelType}. Check live availability and book instantly on Rovera.`,
    path: `/cars/${car.id}`,
  });

  // The car's own photo replaces the branded card on this page.
  const image = { url: car.imageUrl, alt: name };
  return {
    ...base,
    openGraph: { ...base.openGraph, images: [image] },
    twitter: { ...base.twitter, images: [image] },
  };
}

export default async function CarDetailPage({ params }: Params) {
  const car = await getCarById(params.id).catch(() => null);
  if (!car) notFound();

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-8">
      <div className="grid gap-8 md:grid-cols-2">
        <div className="relative aspect-[4/3] overflow-hidden rounded-lg border bg-white">
          <Image
            src={car.imageUrl}
            alt={`${car.make} ${car.model}`}
            fill
            className="object-contain p-6"
            sizes="(max-width: 768px) 100vw, 50vw"
            priority
          />
        </div>

        <div className="space-y-4">
          <h1 className="text-3xl font-bold">
            {car.make} {car.model}
          </h1>
          {car.description && <p className="text-gray-600">{car.description}</p>}
          <ul className="space-y-1 text-gray-600">
            <li>Year: {car.year}</li>
            <li>Body: {car.bodyType}</li>
            <li>Fuel: {car.fuelType}</li>
            <li>Transmission: {car.transmission}</li>
            <li>Seats: {car.seats}</li>
            {car.mileage && <li>Mileage: {car.mileage}</li>}
          </ul>
          <p className="text-2xl font-semibold">
            {formatPrice(car.pricePerDay)} <span className="text-sm text-gray-500">/ day</span>
          </p>
          <Link
            href={`/reservation?carId=${car.id}`}
            className="inline-flex h-12 items-center justify-center rounded-md bg-brand px-8 font-medium text-white transition-colors hover:bg-brand-dark"
          >
            Reserve this car
          </Link>
        </div>
      </div>
    </div>
  );
}
