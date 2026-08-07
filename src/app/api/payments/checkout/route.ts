import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { clientIpFrom, rateLimit, tooManyRequests } from "@/backend/lib/rate-limit";
import { startCheckout } from "@/backend/services/payment.service";

export const runtime = "nodejs";

const bodySchema = z.object({ reference: z.string().trim().min(1) });

// POST /api/payments/checkout — open a Stripe Checkout session for a booking
export async function POST(request: NextRequest) {
  // Each hit can create a Stripe session; also blunts reference guessing.
  const verdict = await rateLimit("checkout", clientIpFrom(request.headers), {
    limit: 10,
    windowSeconds: 600,
  });
  if (!verdict.allowed) return tooManyRequests(verdict.retryAfterSeconds);

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
