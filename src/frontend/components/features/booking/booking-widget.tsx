"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DriverAgeSelect } from "@/frontend/components/features/booking/driver-age-select";
import { LocationSelect } from "@/frontend/components/features/booking/location-select";
import { PromoCodeField } from "@/frontend/components/features/booking/promo-code-field";
import { TimeSelect } from "@/frontend/components/features/booking/time-select";
import { evaluatePromoCode, promotionLabel } from "@/shared/config/promotions";
import { billableDays } from "@/shared/lib/pricing";
import {
  DEFAULT_DRIVER_AGE,
  DEFAULT_PICKUP_TIME,
  DEFAULT_RENTAL_DAYS,
  DEFAULT_RETURN_TIME,
  LOCATIONS,
  MIN_DRIVER_AGE,
  YOUNG_DRIVER_AGE,
  YOUNG_DRIVER_FEE_PER_DAY,
} from "@/shared/constants";
import { addDays, combineDateTime, nextSlotAfter, toDateInput } from "@/shared/lib/datetime";
import { formatPrice } from "@/shared/utils";

const segmentClass = "flex min-w-0 flex-1 flex-col gap-0.5 px-4 py-2 sm:px-5";
const labelClass = "text-[10px] font-semibold uppercase tracking-widest text-gray-500";
const dateClass =
  "h-6 min-w-0 flex-1 bg-transparent text-sm font-medium text-gray-900 focus:outline-none";

function Divider() {
  return <span aria-hidden className="hidden h-9 w-px shrink-0 bg-gray-200 sm:block" />;
}

/** Keep the return strictly after the pickup: fall forward to the next slot on
 *  the pickup day, or to the following day when the branch has already closed. */
function correctReturn(
  pickupDate: string,
  pickupTime: string,
  returnDate: string,
  returnTime: string
) {
  if (!pickupDate || !returnDate) return { returnDate, returnTime };

  const pickupAt = combineDateTime(pickupDate, pickupTime);
  const returnAt = combineDateTime(returnDate, returnTime);
  if (returnAt > pickupAt) return { returnDate, returnTime };

  const laterSlot = nextSlotAfter(pickupTime);
  return laterSlot
    ? { returnDate: pickupDate, returnTime: laterSlot }
    : { returnDate: addDays(pickupDate, 1), returnTime: pickupTime };
}

export function BookingWidget() {
  const router = useRouter();

  const [pickupLocation, setPickupLocation] = useState<string>(LOCATIONS[0]);
  const [dropoffLocation, setDropoffLocation] = useState<string>(LOCATIONS[0]);
  const [sameLocation, setSameLocation] = useState(true);

  // Dates are resolved after mount: "today" depends on the viewer's timezone,
  // and deriving it during render would mismatch the server-rendered markup.
  const [today, setToday] = useState("");
  const [pickupDate, setPickupDate] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [pickupTime, setPickupTime] = useState(DEFAULT_PICKUP_TIME);
  const [returnTime, setReturnTime] = useState(DEFAULT_RETURN_TIME);
  const [driverAge, setDriverAge] = useState(String(DEFAULT_DRIVER_AGE));
  const [promoCode, setPromoCode] = useState("");

  // The picker starts at MIN_DRIVER_AGE, so an ineligible age cannot be
  // selected here; the schema still re-checks bounds server-side.
  const showYoungDriverFee = Number(driverAge) < YOUNG_DRIVER_AGE;

  // Evaluated against the selected dates, since some codes need a minimum
  // rental length. Dates are empty until the mount effect runs.
  const days =
    pickupDate && returnDate
      ? billableDays(
          combineDateTime(pickupDate, pickupTime),
          combineDateTime(returnDate, returnTime)
        )
      : 0;
  const promoStatus = evaluatePromoCode(promoCode, days);

  useEffect(() => {
    const now = toDateInput(new Date());
    setToday(now);
    setPickupDate(now);
    setReturnDate(addDays(now, DEFAULT_RENTAL_DAYS));
  }, []);

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

  function applyReturn(
    nextPickupDate: string,
    nextPickupTime: string,
    nextReturnDate: string,
    nextReturnTime: string
  ) {
    const corrected = correctReturn(
      nextPickupDate,
      nextPickupTime,
      nextReturnDate,
      nextReturnTime
    );
    setReturnDate(corrected.returnDate);
    setReturnTime(corrected.returnTime);
  }

  function onPickupDateChange(value: string) {
    setPickupDate(value);
    applyReturn(value, pickupTime, returnDate, returnTime);
  }

  function onPickupTimeChange(value: string) {
    setPickupTime(value);
    applyReturn(pickupDate, value, returnDate, returnTime);
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Searching with a code that does not exist would imply a discount the
    // renter will never receive, so make them correct or clear it first.
    if (promoStatus.kind === "invalid") return;

    const params = new URLSearchParams({
      pickupLocation,
      dropoffLocation: sameLocation ? pickupLocation : dropoffLocation,
      pickup: pickupDate,
      pickupTime,
      return: returnDate,
      returnTime,
      driverAge,
    });
    if (promoStatus.kind !== "empty") params.set("promo", promoStatus.promotion.code);

    router.push(`/cars?${params.toString()}`);
  }

  return (
    <div className={sameLocation ? "mx-auto w-full max-w-4xl" : "mx-auto w-full max-w-6xl"}>
      <form
        onSubmit={onSubmit}
        aria-label="Find available cars"
        className="flex w-full flex-col divide-y divide-gray-200 rounded-3xl bg-white p-2 shadow-xl ring-1 ring-black/5 sm:flex-row sm:items-center sm:divide-y-0 sm:rounded-full"
      >
        <div className={segmentClass}>
          <span className={labelClass}>{sameLocation ? "Pickup" : "Pickup from"}</span>
          <LocationSelect
            value={pickupLocation}
            onChange={onPickupLocationChange}
            label="Pickup location"
          />
        </div>

        {!sameLocation && (
          <>
            <Divider />
            <div className={segmentClass}>
              <span className={labelClass}>Return to</span>
              <LocationSelect
                value={dropoffLocation}
                onChange={setDropoffLocation}
                label="Drop-off location"
              />
            </div>
          </>
        )}

        <Divider />

        <div className={segmentClass}>
          <span className={labelClass}>From</span>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={pickupDate}
              min={today}
              onChange={(e) => onPickupDateChange(e.target.value)}
              aria-label="Pickup date"
              className={dateClass}
              required
            />
            <TimeSelect
              value={pickupTime}
              onChange={onPickupTimeChange}
              label="Pickup time"
              className="w-[92px] shrink-0"
            />
          </div>
        </div>

        <Divider />

        <div className={segmentClass}>
          <span className={labelClass}>Until</span>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={returnDate}
              min={pickupDate || today}
              onChange={(e) => applyReturn(pickupDate, pickupTime, e.target.value, returnTime)}
              aria-label="Return date"
              className={dateClass}
              required
            />
            <TimeSelect
              value={returnTime}
              onChange={(value) => applyReturn(pickupDate, pickupTime, returnDate, value)}
              label="Return time"
              className="w-[92px] shrink-0"
            />
          </div>
        </div>

        <button
          type="submit"
          className="m-1 h-11 shrink-0 rounded-full bg-brand px-7 text-sm font-semibold text-white transition-colors hover:bg-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-light focus:ring-offset-2"
        >
          Find cars
        </button>
      </form>

      <div className="mt-3 flex flex-col items-center gap-2 sm:flex-row sm:justify-center sm:gap-6">
        <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-gray-600">
          <input
            type="checkbox"
            checked={sameLocation}
            onChange={(e) => onSameLocationChange(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-brand focus:ring-2 focus:ring-brand-light"
          />
          Return to the same location
        </label>

        <span className="inline-flex items-center gap-2 text-sm text-gray-600">
          Driver age
          <DriverAgeSelect value={driverAge} onChange={setDriverAge} />
        </span>

        <PromoCodeField
          value={promoCode}
          onChange={setPromoCode}
          invalid={promoStatus.kind === "invalid"}
          applied={promoStatus.kind === "applied"}
        />
      </div>

      <p className="mt-2 text-center text-sm text-gray-600">
        {showYoungDriverFee
          ? `Drivers under ${YOUNG_DRIVER_AGE} pay a ${formatPrice(
              YOUNG_DRIVER_FEE_PER_DAY
            )}/day young-driver surcharge.`
          : `Minimum driver age ${MIN_DRIVER_AGE}.`}
      </p>

      {promoStatus.kind !== "empty" && (
        <p
          role={promoStatus.kind === "invalid" ? "alert" : undefined}
          className={`mt-1 text-center text-sm ${
            promoStatus.kind === "invalid"
              ? "text-red-600"
              : promoStatus.kind === "applied"
                ? "text-emerald-700"
                : "text-amber-700"
          }`}
        >
          {promoStatus.kind === "invalid"
            ? "That promo code isn’t valid."
            : promoStatus.kind === "applied"
              ? `${promoStatus.promotion.code} applied — ${promotionLabel(promoStatus.promotion)}.`
              : `${promoStatus.promotion.code} needs ${promoStatus.promotion.minDays}+ days — extend your dates to use it.`}
        </p>
      )}
    </div>
  );
}
