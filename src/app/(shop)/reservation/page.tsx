import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCarById } from "@/backend/services/car.service";
import { ReservationForm } from "@/frontend/components/features/reservations/reservation-form";
import { formatPrice } from "@/shared/utils";

export const metadata: Metadata = { title: "Reservation" };

export default async function ReservationPage({
  searchParams,
}: {
  searchParams: { carId?: string; driverAge?: string; promo?: string };
}) {
  if (!searchParams.carId) redirect("/cars");

  const car = await getCarById(searchParams.carId).catch(() => null);
  if (!car) redirect("/cars");

  // Carried over from the search widget when present, so the renter does not
  // re-enter an age they have already given.
  const parsedAge = Number(searchParams.driverAge);
  const driverAge = Number.isInteger(parsedAge) ? parsedAge : undefined;

  return (
    <div className="mx-auto max-w-lg space-y-6 px-4 py-8">
      <div>
        <h1 className="text-3xl font-bold">Reserve your car</h1>
        <p className="mt-1 text-gray-500">
          {car.make} {car.model} · {formatPrice(car.pricePerDay)}/day
        </p>
      </div>
      <ReservationForm
        carId={car.id}
        defaultDriverAge={driverAge}
        defaultPromoCode={searchParams.promo ?? ""}
      />
    </div>
  );
}
