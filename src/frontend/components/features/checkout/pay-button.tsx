"use client";

import { useState } from "react";
import { Button } from "@/frontend/components/ui/button";

/** Opens the Stripe-hosted checkout for a booking and follows its URL. */
export function PayButton({ reference }: { reference: string }) {
  const [error, setError] = useState<string | null>(null);
  const [isRedirecting, setIsRedirecting] = useState(false);

  async function handlePay() {
    setError(null);
    setIsRedirecting(true);
    try {
      const res = await fetch("/api/payments/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reference }),
      });
      const json = await res.json();
      if (json.success && json.data.state === "ready") {
        window.location.assign(json.data.url);
        return;
      }
      setError(json.error ?? "Payment could not be started. Please try again.");
      setIsRedirecting(false);
    } catch {
      setError("Payment could not be started. Please try again.");
      setIsRedirecting(false);
    }
  }

  return (
    <div className="space-y-2">
      <Button className="w-full" onClick={handlePay} disabled={isRedirecting}>
        {isRedirecting ? "Opening secure checkout…" : "Pay now"}
      </Button>
      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
