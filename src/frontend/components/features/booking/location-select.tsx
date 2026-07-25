"use client";

import { LOCATIONS } from "@/shared/constants";
import { cn } from "@/shared/utils";

interface LocationSelectProps {
  value: string;
  onChange: (value: string) => void;
  label: string;
  className?: string;
}

/** Branch picker with the native select chrome replaced by a custom chevron,
 *  so its value aligns with sibling text inputs. */
export function LocationSelect({ value, onChange, label, className }: LocationSelectProps) {
  return (
    <span className="relative block">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={label}
        className={cn(
          "h-6 w-full appearance-none bg-transparent pr-6 text-sm font-medium text-gray-900 focus:outline-none",
          className
        )}
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
  );
}
