"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const LOCATIONS = ["Sydney", "Melbourne", "Brisbane", "Perth", "Adelaide"];

function toDateInput(date: Date) {
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60 * 1000).toISOString().slice(0, 10);
}

const fieldClass =
  "h-11 w-full rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand-light/40";

export function BookingWidget() {
  const router = useRouter();
  const [location, setLocation] = useState(LOCATIONS[0]);
  const [pickup, setPickup] = useState(() => toDateInput(new Date()));
  const [dropoff, setDropoff] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return toDateInput(d);
  });

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams({ location, pickup, return: dropoff });
    router.push(`/cars?${params.toString()}`);
  }

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-xl bg-white p-4 shadow-lg ring-1 ring-black/5 sm:p-5"
      aria-label="Find available cars"
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1.2fr_1fr_1fr_auto]">
        <label className="block">
          <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500">
            Pickup location
          </span>
          <select
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className={fieldClass}
          >
            {LOCATIONS.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500">
            Pickup date
          </span>
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

        <label className="block">
          <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500">
            Return date
          </span>
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
          className="h-11 self-end rounded-md bg-brand px-8 text-sm font-semibold text-white transition-colors hover:bg-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-light focus:ring-offset-2"
        >
          Find cars
        </button>
      </div>

      <p className="mt-3 text-xs text-gray-500">
        Free cancellation up to 24h before pickup · No credit card needed to browse · Instant
        confirmation
      </p>
    </form>
  );
}
