import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Booking confirmed" };

/* Reached by redirect from the reservation form, carrying the booking
 * reference and whether a confirmation email actually went out.
 *
 * The email is only mentioned when one was really sent. Sending depends on a
 * provider key that an environment may not have, and a page that claims an
 * email regardless is how this screen previously came to tell every renter
 * something untrue. Either way the reference is presented as something to
 * keep, because it is the record that always exists. */
export default function ConfirmationPage({
  searchParams,
}: {
  searchParams: { ref?: string; emailed?: string; paid?: string };
}) {
  const reference = searchParams.ref;
  const emailed = searchParams.emailed === "1";
  // Display-only hint from Stripe's return URL; the webhook is the record.
  const paid = searchParams.paid === "1";

  return (
    <div className="mx-auto flex max-w-lg flex-col items-center gap-4 px-4 py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-3xl">
        ✓
      </div>
      <h1 className="text-3xl font-bold">Booking confirmed!</h1>

      {reference ? (
        <div className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
          <p className="text-xs uppercase tracking-wide text-gray-500">
            Your booking reference
          </p>
          <p className="mt-1 font-mono text-xl font-semibold tracking-wider text-gray-900">
            {reference}
          </p>
        </div>
      ) : (
        <p className="text-gray-500">
          Your booking is saved. You can find it under your rentals.
        </p>
      )}

      {paid && (
        <p className="font-medium text-emerald-700">Payment received — you&apos;re all set.</p>
      )}

      {emailed && (
        <p className="text-gray-500">
          A confirmation email is on its way with the details.
        </p>
      )}

      <p className="text-gray-500">
        Keep this reference, quote it if you need to get in touch about the
        booking. You can find it again any time under your rentals.
      </p>

      <Link href="/rentals" className="text-brand underline underline-offset-4">
        View my rentals
      </Link>
    </div>
  );
}
