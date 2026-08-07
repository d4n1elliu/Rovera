import { NextResponse, type NextRequest } from "next/server";
import { ZodError } from "zod";
import { auth } from "@/auth";
import { clientIpFrom, rateLimit, tooManyRequests } from "@/backend/lib/rate-limit";
import { createReservation, getRentalHistory } from "@/backend/services/reservation.service";

export const runtime = "nodejs";

/* POST /api/reservations — create a reservation.
 *
 * Deliberately open. Booking without an account is a product feature: the
 * reservation flow upserts the renter by email, and signing up later claims
 * that same row rather than creating a second one. Requiring a session here
 * would remove the ability to book as a guest. */
export async function POST(request: NextRequest) {
  // Bookings write reservations AND upsert users, so the window is generous
  // for a renter but a wall for a script.
  const verdict = await rateLimit("book", clientIpFrom(request.headers), {
    limit: 10,
    windowSeconds: 3600,
  });
  if (!verdict.allowed) return tooManyRequests(verdict.retryAfterSeconds);

  try {
    const body = await request.json();
    const reservation = await createReservation(body);
    return NextResponse.json({ success: true, data: reservation }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors[0]?.message ?? "Invalid input" },
        { status: 422 }
      );
    }
    const message = error instanceof Error ? error.message : "Failed to create reservation";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}

/* GET /api/reservations — the signed-in renter's reservations.
 *
 * The address comes from the session. This used to read ?email=, which
 * returned any renter's booking history to anyone who supplied their
 * address. */
export async function GET() {
  const session = await auth();

  if (!session?.user?.email) {
    return NextResponse.json({ success: false, error: "Not signed in" }, { status: 401 });
  }

  const reservations = await getRentalHistory(session.user.email);
  return NextResponse.json({ success: true, data: reservations });
}
