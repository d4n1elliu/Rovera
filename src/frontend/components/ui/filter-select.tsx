"use client";

import { cn } from "@/shared/utils";
import type { SelectOption } from "@/frontend/components/ui/bare-select";

/** Bordered select used by the listing controls.
 *
 *  Distinct from BareSelect, which is deliberately chrome-less so its value
 *  sits on the same baseline as the booking widget's text inputs. This one
 *  reads as a standalone control, and owns the shared styling so the filter
 *  and sort dropdowns cannot drift apart. */
export function FilterSelect({
  label,
  value,
  onChange,
  options,
  className,
}: {
  /** Accessible name. The visible label, if any, sits outside the control. */
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly SelectOption[];
  className?: string;
}) {
  return (
    <select
      aria-label={label}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className={cn(
        "h-10 rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-700",
        "focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand-light/40",
        className
      )}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
