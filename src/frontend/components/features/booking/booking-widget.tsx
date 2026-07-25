"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LocationSelect } from "@/frontend/components/features/booking/location-select";
import { DEFAULT_RENTAL_DAYS, LOCATIONS } from "@/shared/constants";

function toDateInput(date: Date) {
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60 * 1000).toISOString().slice(0, 10);
}

const segmentClass = "flex min-w-0 flex-1 flex-col gap-0.5 px-5 py-2";
const labelClass = "text-[10px] font-semibold uppercase tracking-widest text-gray-500";
const fieldClass =
  "h-6 w-full bg-transparent text-sm font-medium text-gray-900 focus:outline-none";

function Divider() {
  return <span aria-hidden className="hidden h-9 w-px shrink-0 bg-gray-200 sm:block" />;
}

export function BookingWidget() {
  const router = useRouter();
  const [pickupLocation, setPickupLocation] = useState<string>(LOCATIONS[0]);
  const [dropoffLocation, setDropoffLocation] = useState<string>(LOCATIONS[0]);
  const [sameLocation, setSameLocation] = useState(true);
  const [pickup, setPickup] = useState(() => toDateInput(new Date()));
  const [dropoff, setDropoff] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + DEFAULT_RENTAL_DAYS);
    return toDateInput(d);
  });

  // While the branches are linked, the drop-off follows the pickup so that
  // unlinking them reveals the city the renter already chose.
  function onPickupLocationChange(value: string) {
    setPickupLocation(value);
    if (sameLocation) setDropoffLocation(value);
  }

  function onSameLocationChange(checked: boolean) {
    setSameLocation(checked);
    if (checked) setDropoffLocation(pickupLocation);
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams({
      pickupLocation,
      dropoffLocation: sameLocation ? pickupLocation : dropoffLocation,
      pickup,
      return: dropoff,
    });
    router.push(`/cars?${params.toString()}`);
  }

  return (
    <div className={sameLocation ? "mx-auto w-full max-w-3xl" : "mx-auto w-full max-w-4xl"}>
      <form
        onSubmit={onSubmit}
        aria-label="Find available cars"
        className="flex w-full flex-col divide-y divide-gray-200 rounded-3xl bg-white p-2 shadow-xl ring-1 ring-black/5 sm:flex-row sm:items-center sm:divide-y-0 sm:rounded-full"
      >
        <label className={segmentClass}>
          <span className={labelClass}>{sameLocation ? "Pickup" : "Pickup from"}</span>
          <LocationSelect
            value={pickupLocation}
            onChange={onPickupLocationChange}
            label="Pickup location"
          />
        </label>

        {!sameLocation && (
          <>
            <Divider />
            <label className={segmentClass}>
              <span className={labelClass}>Return to</span>
              <LocationSelect
                value={dropoffLocation}
                onChange={setDropoffLocation}
                label="Drop-off location"
              />
            </label>
          </>
        )}

        <Divider />

        <label className={segmentClass}>
          <span className={labelClass}>From</span>
          <input
            type="date"
            value={pickup}
            min={toDateInput(new Date())}
            onChange={(e) => {
              setPickup(e.target.value);
              if (e.target.value > dropoff) setDropoff(e.target.value);
            }}
            className={fieldClass}
            required
          />
        </label>

        <Divider />

        <label className={segmentClass}>
          <span className={labelClass}>Until</span>
          <input
            type="date"
            value={dropoff}
            min={pickup}
            onChange={(e) => setDropoff(e.target.value)}
            className={fieldClass}
            required
          />
        </label>

        <button
          type="submit"
          className="m-1 h-11 shrink-0 rounded-full bg-brand px-7 text-sm font-semibold text-white transition-colors hover:bg-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-light focus:ring-offset-2"
        >
          Find cars
        </button>
      </form>

      <div className="mt-3 flex justify-center">
        <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-gray-600">
          <input
            type="checkbox"
            checked={sameLocation}
            onChange={(e) => onSameLocationChange(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-brand focus:ring-2 focus:ring-brand-light"
          />
          Return to the same location
        </label>
      </div>
    </div>
  );
}
