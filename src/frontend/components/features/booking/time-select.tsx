"use client";

import { BareSelect } from "@/frontend/components/ui/bare-select";
import { TIME_SLOTS } from "@/shared/lib/datetime";

interface TimeSelectProps {
  value: string;
  onChange: (value: string) => void;
  label: string;
  className?: string;
}

/** Pickup/return time picker limited to slots within branch opening hours. */
export function TimeSelect({ value, onChange, label, className }: TimeSelectProps) {
  return (
    <BareSelect
      value={value}
      onChange={onChange}
      label={label}
      options={TIME_SLOTS}
      className={className}
    />
  );
}
