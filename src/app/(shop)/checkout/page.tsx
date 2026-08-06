import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { isStripeConfigured } from "@/backend/lib/payments/stripe";
import { paymentRepository } from "@/backend/repositories/payment.repository";
import { reservationRepository } from "@/backend/repositories/reservation.repository";
import { PayButton } from "@/frontend/components/features/checkout/pay-button";
import { formatDateTime, formatPrice } from "@/shared/utils";

export const metadata: Metadata = { title: "Checkout" };
export const dynamic = "force-dynamic";

/* Reached after booking with the RVR- reference — the renter's proof of
 * booking, which is what gates this page instead of a session. */
export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: { ref?: string; emailed?: string };
}) {
  if (!searchParams.ref) redirect("/cars");

  const found = await reservationRepository.findByReference(searchParams.ref);
  if (!found) redirect("/cars");
  const { reservation, car } = found;

  const payment = await paymentRepository.findForReservation(reservation.id);
  const alreadyPaid = payment?.status === "succeeded" || reservation.status !== "pending";
  const confirmationHref = `/confirmation?ref=${encodeURIComponent(reservation.reference)}${
    searchParams.emailed === "1" ? "&emailed=1" : ""
  }`;

  const row = (label: string, value: string, strong = false) => (
    <div className="flex justify-between text-sm">
      <span className="text-gray-500">{label}</span>
      <span className={strong ? "font-semibold text-gray-900" : "text-gray-900"}>{value}</span>
    </div>
  );

  return (
    <div className="mx-auto max-w-lg space-y-6 px-4 py-8">
      <div>
        <h1 className="text-3xl font-bold">Checkout</h1>
        <p className="mt-1 text-gray-500">
          Booking <span className="font-mono">{reservation.reference}</span>
        </p>
      </div>

      <div className="space-y-3 rounded-lg border bg-white p-5">
        {row("Car", `${car.year} ${car.make} ${car.model}`)}
        {row("Pickup", formatDateTime(reservation.pickupAt))}
        {row("Return", formatDateTime(reservation.returnAt))}
        <hr className="border-gray-100" />
        {row(`Rental (${reservation.days} ${reservation.days === 1 ? "day" : "days"})`, formatPrice(reservation.baseTotal))}
        {reservation.youngDriverFee > 0 &&
          row("Young driver surcharge", formatPrice(reservation.youngDriverFee))}
        {reservation.discount > 0 && row("Discount", `−${formatPrice(reservation.discount)}`)}
        {row("Total", formatPrice(reservation.totalPrice), true)}
      </div>

      {alreadyPaid ? (
        <p className="text-sm text-gray-600">
          This booking is already {reservation.status === "pending" ? "paid" : reservation.status}.{" "}
          <Link href={confirmationHref} className="text-brand underline underline-offset-4">
            View confirmation
          </Link>
        </p>
      ) : isStripeConfigured() ? (
        <div className="space-y-3">
          <PayButton reference={reservation.reference} />
          <p className="text-center text-xs text-gray-500">
            Secure payment via Stripe. You&apos;ll be brought back here afterwards.
          </p>
        </div>
      ) : (
        <p className="text-sm text-gray-600">
          Online payment isn&apos;t available yet — your booking is recorded and you can
          pay at pickup.{" "}
          <Link href={confirmationHref} className="text-brand underline underline-offset-4">
            Continue to confirmation
          </Link>
        </p>
      )}
    </div>
  );
}
