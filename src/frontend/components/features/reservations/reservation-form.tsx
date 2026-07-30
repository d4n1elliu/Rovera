"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/frontend/components/ui/button";
import { Input } from "@/frontend/components/ui/input";
import {
  DriverAgeSelect,
  normaliseDriverAge,
} from "@/frontend/components/features/booking/driver-age-select";
import { PromoCodeField } from "@/frontend/components/features/booking/promo-code-field";
import { findPromotion, normalisePromoCode, promotionLabel } from "@/shared/config/promotions";
import { toDateInput } from "@/shared/lib/datetime";
import { reservationSchema } from "@/shared/schemas/reservation.schema";
import {
  DEFAULT_DRIVER_AGE,
  YOUNG_DRIVER_AGE,
  YOUNG_DRIVER_FEE_PER_DAY,
} from "@/shared/constants";
import { formatPrice } from "@/shared/utils";

export function ReservationForm({
  carId,
  defaultDriverAge = DEFAULT_DRIVER_AGE,
  defaultPromoCode = "",
  defaultPickupDate = "",
  defaultReturnDate = "",
}: {
  carId: string;
  defaultDriverAge?: number;
  defaultPromoCode?: string;
  defaultPickupDate?: string;
  defaultReturnDate?: string;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [driverAge, setDriverAge] = useState(() => normaliseDriverAge(defaultDriverAge));
  const [promoCode, setPromoCode] = useState(() => normalisePromoCode(defaultPromoCode));

  // Resolved after mount: "today" depends on the viewer's timezone, so
  // deriving it during render would mismatch the server-rendered markup.
  const [today, setToday] = useState("");
  const [pickupDate, setPickupDate] = useState(defaultPickupDate);
  const [returnDate, setReturnDate] = useState(defaultReturnDate);

  useEffect(() => {
    setToday(toDateInput(new Date()));
  }, []);

  const promoIsInvalid = promoCode.trim() !== "" && !findPromotion(promoCode);

  const showYoungDriverFee = Number(driverAge) < YOUNG_DRIVER_AGE;

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
      /* The booking reference, not the row id. It is what the renter quotes to
       * support, it is designed to survive being read aloud, and it keeps the
       * internal identifier out of a URL that gets bookmarked and shared. */
      router.push(`/confirmation?ref=${encodeURIComponent(json.data.reference)}`);
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

      <div className="text-sm text-gray-600">
        <span className="block">Driver age</span>
        <DriverAgeSelect
          name="driverAge"
          value={driverAge}
          onChange={setDriverAge}
          className="mt-1 h-10 w-full rounded-md px-3"
        />
        {showYoungDriverFee && (
          <span className="mt-1 block text-xs text-gray-500">
            Drivers under {YOUNG_DRIVER_AGE} pay a {formatPrice(YOUNG_DRIVER_FEE_PER_DAY)}/day
            young-driver surcharge, included in your total.
          </span>
        )}
      </div>

      <div className="text-sm text-gray-600">
        <span className="block">Promo code (optional)</span>
        <PromoCodeField
          name="promoCode"
          value={promoCode}
          onChange={setPromoCode}
          invalid={promoIsInvalid}
          applied={Boolean(findPromotion(promoCode))}
          className="mt-1 w-full rounded-md"
        />
        {promoIsInvalid ? (
          <span className="mt-1 block text-xs text-red-600">That promo code isn’t valid.</span>
        ) : (
          findPromotion(promoCode) && (
            <span className="mt-1 block text-xs text-emerald-700">
              {promotionLabel(findPromotion(promoCode)!)}, applied to your total.
            </span>
          )
        )}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm text-gray-600">
          Pickup date
          <Input
            name="pickupDate"
            type="date"
            value={pickupDate}
            min={today}
            onChange={(e) => setPickupDate(e.target.value)}
            required
            className="mt-1"
          />
        </label>
        <label className="text-sm text-gray-600">
          Return date
          <Input
            name="returnDate"
            type="date"
            value={returnDate}
            min={pickupDate || today}
            onChange={(e) => setReturnDate(e.target.value)}
            required
            className="mt-1"
          />
        </label>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Reserving…" : "Reserve now"}
      </Button>
    </form>
  );
}
