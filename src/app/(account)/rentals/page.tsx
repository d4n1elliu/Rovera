import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth, SIGN_IN_PATH } from "@/auth";
import { getRentalHistory } from "@/backend/services/reservation.service";
import { formatDate, formatPrice } from "@/shared/utils";

export const metadata: Metadata = { title: "My rentals" };

// Rendered per-request: rental history is per-customer data from the DB.
export const dynamic = "force-dynamic";

export default async function RentalsPage() {
  /* Checked here as well as in middleware. Middleware only sees requests that
   * match its config, so a page that reads one renter's data confirms who is
   * asking rather than assuming something upstream already did. */
  const session = await auth();
  if (!session?.user?.email) redirect(`${SIGN_IN_PATH}?callbackUrl=/rentals`);

  const rentals = await getRentalHistory(session.user.email);

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <h1 className="text-3xl font-bold">My rentals</h1>

      {rentals.length === 0 ? (
        <p className="text-gray-500">You haven&apos;t rented a car yet.</p>
      ) : (
        <ul className="space-y-4">
          {rentals.map((rental) => (
            <li key={rental.id} className="rounded-lg border bg-white p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold">
                    {rental.car.make} {rental.car.model}
                  </p>
                  <p className="text-sm text-gray-500">
                    {formatDate(rental.pickupAt)} → {formatDate(rental.returnAt)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{formatPrice(rental.totalPrice)}</p>
                  <p className="text-sm capitalize text-gray-500">{rental.status}</p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
