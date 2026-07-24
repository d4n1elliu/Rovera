import { NextResponse, type NextRequest } from "next/server";
import { getRentalHistory } from "@/backend/services/reservation.service";

// GET /api/orders?email=… — rental history data (was rental_history.php)
export async function GET(request: NextRequest) {
  const email = request.nextUrl.searchParams.get("email");
  if (!email) {
    return NextResponse.json({ success: false, error: "email is required" }, { status: 400 });
  }
  const orders = await getRentalHistory(email);
  return NextResponse.json({ success: true, data: orders });
}
