import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { startCheckout } from "@/backend/services/payment.service";

export const runtime = "nodejs";

const bodySchema = z.object({ reference: z.string().trim().min(1) });

// POST /api/payments/checkout — open a Stripe Checkout session for a booking
export async function POST(request: NextRequest) {
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: "reference is required" }, { status: 422 });
  }

  const result = await startCheckout(parsed.data.reference);
  if (!result) {
    return NextResponse.json({ success: false, error: "Booking not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true, data: result });
}
