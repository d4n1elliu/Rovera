"use client";

import { cn } from "@/shared/utils";

interface PromoCodeFieldProps {
  value: string;
  onChange: (value: string) => void;
  /** Set when the value must be submitted with a surrounding form. */
  name?: string;
  invalid?: boolean;
  applied?: boolean;
  /** Styles the bordered shell; defaults to a compact pill. */
  className?: string;
}

/** Promo code entry, styled to match the driver-age pill beside it. */
export function PromoCodeField({
  value,
  onChange,
  name,
  invalid,
  applied,
  className,
}: PromoCodeFieldProps) {
  return (
    <input
      type="text"
      value={value}
      name={name}
      onChange={(e) => onChange(e.target.value.toUpperCase())}
      placeholder="Promo code"
      aria-label="Promo code"
      aria-invalid={invalid || undefined}
      autoCapitalize="characters"
      autoComplete="off"
      spellCheck={false}
      className={cn(
        "h-9 w-32 rounded-full border bg-white px-3 text-center text-sm font-medium uppercase tracking-wide text-gray-900 placeholder:font-normal placeholder:normal-case placeholder:tracking-normal placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-light/40",
        invalid
          ? "border-red-400"
          : applied
            ? "border-emerald-500"
            : "border-gray-300 focus:border-brand",
        className
      )}
    />
  );
}
