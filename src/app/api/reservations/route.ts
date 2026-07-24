import { NextResponse, type NextRequest } from "next/server";
import { ZodError } from "zod";
import { createReservation, getRentalHistory } from "@/backend/services/reservation.service";

// POST /api/reservations — create a reservation
export async function POST(request: NextRequest) {
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

// GET /api/reservations?email=… — list a customer's reservations
export async function GET(request: NextRequest) {
  const email = request.nextUrl.searchParams.get("email");
  if (!email) {
    return NextResponse.json({ success: false, error: "email is required" }, { status: 400 });
  }
  const reservations = await getRentalHistory(email);
  return NextResponse.json({ success: true, data: reservations });
}
