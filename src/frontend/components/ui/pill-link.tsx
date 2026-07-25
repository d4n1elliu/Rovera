import Link from "next/link";
import type { AnchorHTMLAttributes, ReactNode } from "react";
import { cn } from "@/shared/utils";

type Variant = "brand" | "accent" | "ghost" | "white";
type Size = "sm" | "md";

const variants: Record<Variant, string> = {
  brand: "bg-brand text-white hover:bg-brand-dark",
  accent: "bg-accent text-gray-900 hover:bg-accent-light",
  ghost:
    "border border-white/60 bg-transparent text-white hover:border-accent hover:bg-accent hover:text-gray-900",
  white: "bg-white text-gray-900 hover:bg-blue-50",
};

const sizes: Record<Size, string> = {
  sm: "h-10 px-5",
  md: "h-12 px-8",
};

export interface PillLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  variant?: Variant;
  size?: Size;
  children: ReactNode;
}

/** Rounded-full call-to-action link used across the marketing pages. */
export function PillLink({
  href,
  variant = "brand",
  size = "md",
  className,
  children,
  ...props
}: PillLinkProps) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center justify-center rounded-full text-sm font-semibold transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-light",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </Link>
  );
}
