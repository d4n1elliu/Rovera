import { NextResponse, type NextRequest } from "next/server";
import { getStripe } from "@/backend/lib/payments/stripe";
import { handleStripeEvent } from "@/backend/services/payment.service";

export const runtime = "nodejs";

// POST /api/webhooks/stripe — Stripe's server calls this; nothing else should.
export async function POST(request: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = request.headers.get("stripe-signature");
  if (!secret || !signature) {
    return NextResponse.json({ error: "webhook not configured" }, { status: 400 });
  }

  // Verified against the raw body — a parsed-then-reserialised body would
  // break the signature and let a forged event through unnoticed.
  const payload = await request.text();
  let event;
  try {
    event = getStripe().webhooks.constructEvent(payload, signature, secret);
  } catch {
    return NextResponse.json({ error: "invalid signature" }, { status: 400 });
  }

  await handleStripeEvent(event);
  return NextResponse.json({ received: true });
}
