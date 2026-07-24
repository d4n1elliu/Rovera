import { CarCard } from "@/frontend/components/features/cars/car-card";
import type { Car } from "@/shared/types";

export function CarGrid({ cars }: { cars: Car[] }) {
  if (cars.length === 0) {
    return (
      <p className="py-12 text-center text-gray-500">
        No cars match your search. Try adjusting the filters.
      </p>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {cars.map((car) => (
        <CarCard key={car.id} car={car} />
      ))}
    </div>
  );
}
