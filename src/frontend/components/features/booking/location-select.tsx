"use client";

import { BareSelect } from "@/frontend/components/ui/bare-select";
import { LOCATIONS } from "@/shared/constants";

const LOCATION_OPTIONS = LOCATIONS.map((city) => ({ value: city, label: city }));

interface LocationSelectProps {
  value: string;
  onChange: (value: string) => void;
  label: string;
  className?: string;
}

/** Branch picker for pickup and drop-off. */
export function LocationSelect({ value, onChange, label, className }: LocationSelectProps) {
  return (
    <BareSelect
      value={value}
      onChange={onChange}
      label={label}
      options={LOCATION_OPTIONS}
      className={className}
    />
  );
}
