"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/frontend/components/ui/button";
import { Input } from "@/frontend/components/ui/input";
import { reservationSchema } from "@/shared/schemas/reservation.schema";

export function ReservationForm({ carId }: { carId: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const raw = Object.fromEntries(new FormData(event.currentTarget));
    const parsed = reservationSchema.safeParse({ ...raw, carId });
    if (!parsed.success) {
      setError(parsed.error.errors[0]?.message ?? "Please check the form");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...raw, carId }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      router.push(`/confirmation?id=${json.data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Input name="firstName" placeholder="First name" required />
        <Input name="lastName" placeholder="Last name" required />
      </div>
      <Input name="email" type="email" placeholder="Email" required />
      <Input name="phone" type="tel" placeholder="Phone" required />
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm text-gray-600">
          Pickup date
          <Input name="pickupDate" type="date" required className="mt-1" />
        </label>
        <label className="text-sm text-gray-600">
          Return date
          <Input name="returnDate" type="date" required className="mt-1" />
        </label>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Reserving…" : "Reserve now"}
      </Button>
    </form>
  );
}
