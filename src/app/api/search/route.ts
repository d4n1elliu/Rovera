import { NextResponse, type NextRequest } from "next/server";
import { searchCars } from "@/backend/services/car.service";

// GET /api/search?q=corolla — autocomplete suggestions for the search bar
export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q") ?? "";
  const cars = await searchCars(query);
  return NextResponse.json({ success: true, data: cars.slice(0, 5) });
}
