import { siteConfig } from "@/frontend/config/site";

/** Intro disclaimer for the help, terms and privacy pages. */
export function DemoNotice() {
  return (
    <p role="note" className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
      <strong>This is a fictional service.</strong> {siteConfig.name} is a portfolio project by{" "}
      {siteConfig.portfolio.author}: bookings are simulated, and no insurance, support or vehicles
      are provided. The copy below shows how a real rental site would read.
    </p>
  );
}
