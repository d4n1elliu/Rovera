import { NextResponse } from "next/server";
import { getCarById } from "@/backend/services/car.service";

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// GET /api/cars/:id
export async function GET(_request: Request, { params }: { params: { id: string } }) {
  try {
    const car = await getCarById(params.id);
    return NextResponse.json({ success: true, data: car });
  } catch {
    return NextResponse.json({ success: false, error: "Car not found" }, { status: 404 });
  }
}
