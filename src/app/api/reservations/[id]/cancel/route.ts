import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { cancelReservation } from "@/backend/services/reservation.service";

export const runtime = "nodejs";

// POST /api/reservations/:id/cancel — the signed-in renter cancels their booking
export async function POST(_request: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Not signed in" }, { status: 401 });
  }

  const result = await cancelReservation(params.id, session.user.id);
  if (!result.ok) {
    const message =
      result.reason === "refund-failed"
        ? "The refund could not be processed, so the booking was not cancelled. Please try again."
        : "This booking can no longer be cancelled.";
    return NextResponse.json({ success: false, error: message }, { status: 409 });
  }

  return NextResponse.json({ success: true, data: { refund: result.refund } });
}
