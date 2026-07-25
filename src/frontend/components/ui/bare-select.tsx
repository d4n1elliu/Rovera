"use client";

import { cn } from "@/shared/utils";

export interface SelectOption {
  value: string;
  label: string;
}

interface BareSelectProps {
  value: string;
  onChange: (value: string) => void;
  /** Accessible name; the visible label sits outside the control. */
  label: string;
  options: readonly SelectOption[];
  /** Set when the value must be submitted with a surrounding form. */
  name?: string;
  className?: string;
}

/** Select with the native chrome replaced by a custom chevron, so its value
 *  sits on the same baseline as sibling text inputs. */
export function BareSelect({
  value,
  onChange,
  label,
  options,
  name,
  className,
}: BareSelectProps) {
  return (
    <span className={cn("relative block min-w-0", className)}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        name={name}
        aria-label={label}
        className="h-6 w-full appearance-none truncate bg-transparent pr-5 text-sm font-medium text-gray-900 focus:outline-none"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <svg
        aria-hidden
        viewBox="0 0 24 24"
        fill="none"
        className="pointer-events-none absolute right-0 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500"
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
