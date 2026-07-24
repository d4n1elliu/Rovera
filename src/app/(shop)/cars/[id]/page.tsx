import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCarById } from "@/backend/services/car.service";
import { formatPrice } from "@/shared/utils";

export default async function CarDetailPage({ params }: { params: { id: string } }) {
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
