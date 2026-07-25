import { cn } from "@/shared/utils";

/** Small uppercase section label with an accent square marker. */
export function Eyebrow({ children, dark = false }: { children: React.ReactNode; dark?: boolean }) {
  return (
    <p
      className={cn(
        "flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.25em]",
        dark ? "text-accent" : "text-gray-700"
      )}
    >
      <span aria-hidden className="inline-block h-3 w-3 bg-accent" />
      {children}
    </p>
  );
}
