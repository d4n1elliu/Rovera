"use client";

import { BareSelect } from "@/frontend/components/ui/bare-select";
import { LOCATIONS } from "@/shared/constants";

const LOCATION_OPTIONS = LOCATIONS.map((city) => ({ value: city, label: city }));

interface LocationSelectProps {
  value: string;
  onChange: (value: string) => void;
  label: string;
  /** Set when the value must submit with a surrounding form. */
  name?: string;
  className?: string;
}

/** Branch picker for pickup and drop-off. */
export function LocationSelect({ value, onChange, label, name, className }: LocationSelectProps) {
  return (
    <BareSelect
      value={value}
      onChange={onChange}
      label={label}
      name={name}
      options={LOCATION_OPTIONS}
      className={className}
    />
  );
}
