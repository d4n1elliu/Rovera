import type { Metadata } from "next";

export const metadata: Metadata = { title: "Checkout" };

// Placeholder — wire up payment collection here (Stripe, etc.).
export default function CheckoutPage() {
  return (
    <div className="mx-auto max-w-lg space-y-4 px-4 py-8">
      <h1 className="text-3xl font-bold">Checkout</h1>
      <p className="text-gray-500">Payment step coming soon.</p>
    </div>
  );
}
