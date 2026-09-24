import { siteConfig } from "@/frontend/config/site";

/** Stripe runs in test mode; shown wherever a payment is offered or confirmed. */
export function TestModeNotice({ children }: { children?: React.ReactNode }) {
  return (
    <p role="note" className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
      {children ?? (
        <>
          Test mode — use Stripe test card{" "}
          <span className="font-mono">{siteConfig.portfolio.testCard}</span>. No real charge is
          made.
        </>
      )}
    </p>
  );
}
