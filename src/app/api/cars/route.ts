import { NextResponse, type NextRequest } from "next/server";
import { getCars } from "@/backend/services/car.service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// GET /api/cars?bodyType=suv&fuelType=hybrid&maxPrice=100&query=toyota
//              &sort=price-asc&page=2&pageSize=20
export async function GET(request: NextRequest) {
  try {
    const query = Object.fromEntries(request.nextUrl.searchParams);
    const { cars, pagination } = await getCars(query);

    // `data` stays the array it has always been, so existing callers keep
    // working; paging lives alongside it rather than wrapping it.
    return NextResponse.json({ success: true, data: cars, pagination });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load cars";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
