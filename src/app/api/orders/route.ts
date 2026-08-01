import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getRentalHistory } from "@/backend/services/reservation.service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/* GET /api/orders — the signed-in renter's rental history.
 *
 * The address comes from the session, never from the request. This route used
 * to accept ?email=, which handed any renter's bookings — their name, the
 * cars, the dates and what they paid — to anyone who could guess an address. */
export async function GET() {
  const session = await auth();

  if (!session?.user?.email) {
    return NextResponse.json({ success: false, error: "Not signed in" }, { status: 401 });
  }

  const orders = await getRentalHistory(session.user.email);
  return NextResponse.json({ success: true, data: orders });
}
