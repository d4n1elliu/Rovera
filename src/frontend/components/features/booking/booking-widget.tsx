"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { siteConfig } from "@/frontend/config/site";
import { DEFAULT_RENTAL_DAYS } from "@/shared/constants";

const LOCATIONS = siteConfig.locations;

function toDateInput(date: Date) {
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60 * 1000).toISOString().slice(0, 10);
}

const segmentClass = "flex min-w-0 flex-1 flex-col gap-0.5 px-5 py-2";
const labelClass = "text-[10px] font-semibold uppercase tracking-widest text-gray-500";
const fieldClass =
  "h-6 w-full bg-transparent text-sm font-medium text-gray-900 focus:outline-none";

export function BookingWidget() {
  const router = useRouter();
  const [location, setLocation] = useState<string>(LOCATIONS[0]);
  const [pickup, setPickup] = useState(() => toDateInput(new Date()));
  const [dropoff, setDropoff] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + DEFAULT_RENTAL_DAYS);
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
      aria-label="Find available cars"
      className="mx-auto flex w-full max-w-3xl flex-col divide-y divide-gray-200 rounded-3xl bg-white p-2 shadow-xl ring-1 ring-black/5 sm:flex-row sm:items-center sm:divide-y-0 sm:rounded-full"
    >
      <label className={segmentClass}>
        <span className={labelClass}>Pickup</span>
        <span className="relative block">
          <select
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className={`${fieldClass} appearance-none pr-6`}
          >
            {LOCATIONS.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
          <svg
            aria-hidden
            viewBox="0 0 24 24"
            fill="none"
            className="pointer-events-none absolute right-1 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500"
          >
            <path
              d="M6 9l6 6 6-6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </label>

      <span aria-hidden className="hidden h-9 w-px shrink-0 bg-gray-200 sm:block" />

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

      <span aria-hidden className="hidden h-9 w-px shrink-0 bg-gray-200 sm:block" />

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
  );
}
