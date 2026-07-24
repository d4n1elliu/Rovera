import { NextResponse, type NextRequest } from "next/server";
import { getCars } from "@/backend/services/car.service";

// GET /api/cars?bodyType=suv&fuelType=hybrid&minPrice=30&maxPrice=100&query=toyota
export async function GET(request: NextRequest) {
  try {
    const filters = Object.fromEntries(request.nextUrl.searchParams);
    const cars = await getCars(filters);
    return NextResponse.json({ success: true, data: cars });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load cars";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
