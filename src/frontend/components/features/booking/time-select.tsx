"use client";

import { BareSelect } from "@/frontend/components/ui/bare-select";
import { TIME_SLOTS } from "@/shared/lib/datetime";

interface TimeSelectProps {
  value: string;
  onChange: (value: string) => void;
  label: string;
  /** Earliest selectable slot, e.g. the next slot still ahead of now when the
   *  chosen date is today. Slots before it are not offered at all. */
  minTime?: string;
  className?: string;
}

/** Pickup/return time picker limited to slots within branch opening hours. */
export function TimeSelect({ value, onChange, label, minTime, className }: TimeSelectProps) {
  const options = minTime ? TIME_SLOTS.filter((slot) => slot.value >= minTime) : TIME_SLOTS;

  return (
    <BareSelect
      value={value}
      onChange={onChange}
      label={label}
      options={options}
      className={className}
    />
  );
}
