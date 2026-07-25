"use client";

import { BareSelect } from "@/frontend/components/ui/bare-select";
import { MIN_DRIVER_AGE, YOUNG_DRIVER_AGE } from "@/shared/constants";
import { cn } from "@/shared/utils";

// Australian rental companies rent from 21 and surcharge drivers under 25, so
// those two ages bound the list: anything lower we do not rent to, and every
// age above the threshold is priced the same.
const AGE_OPTIONS = Array.from({ length: YOUNG_DRIVER_AGE - MIN_DRIVER_AGE + 1 }, (_, i) => {
  const age = MIN_DRIVER_AGE + i;
  return {
    value: String(age),
    label: age === YOUNG_DRIVER_AGE ? `${age}+` : String(age),
  };
});

/** Map any age onto the option that represents it, so a value carried in from
 *  elsewhere (a saved search, a shared link) still selects correctly. */
export function normaliseDriverAge(age: number) {
  if (!Number.isFinite(age)) return String(YOUNG_DRIVER_AGE);
  return String(Math.min(Math.max(Math.trunc(age), MIN_DRIVER_AGE), YOUNG_DRIVER_AGE));
}

interface DriverAgeSelectProps {
  value: string;
  onChange: (value: string) => void;
  name?: string;
  /** Styles the bordered shell; defaults to a compact pill. */
  className?: string;
}

/** Age picker for the driver, offered as a short list so there is no native
 *  number spinner and no oversized dropdown. */
export function DriverAgeSelect({ value, onChange, name, className }: DriverAgeSelectProps) {
  return (
    <span
      className={cn(
        "inline-flex h-9 items-center rounded-full border border-gray-300 bg-white px-3 transition-colors focus-within:border-brand focus-within:ring-2 focus-within:ring-brand-light/40",
        className
      )}
    >
      <BareSelect
        value={value}
        onChange={onChange}
        name={name}
        label="Driver age"
        options={AGE_OPTIONS}
        className="w-14"
      />
    </span>
  );
}
