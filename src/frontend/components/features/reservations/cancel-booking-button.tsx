"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/** Cancels a booking after an inline confirm, then refreshes the list. */
export function CancelBookingButton({ reservationId, paid }: { reservationId: string; paid: boolean }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCancel() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/reservations/${reservationId}/cancel`, { method: "POST" });
      const json = await res.json();
      if (!json.success) {
        setError(json.error ?? "Could not cancel the booking.");
        setConfirming(false);
        return;
      }
      router.refresh();
    } catch {
      setError("Could not cancel the booking.");
      setConfirming(false);
    } finally {
      setBusy(false);
    }
  }

  if (!confirming) {
    return (
      <div className="text-right">
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="text-sm text-red-600 underline underline-offset-4 hover:text-red-700"
        >
          Cancel booking
        </button>
        {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      </div>
    );
  }

  return (
    <div className="text-right text-sm">
      <p className="text-gray-600">
        {paid ? "Cancel and refund this booking?" : "Cancel this booking?"}
      </p>
      <div className="mt-1 flex justify-end gap-3">
        <button
          type="button"
          onClick={handleCancel}
          disabled={busy}
          className="font-medium text-red-600 hover:text-red-700 disabled:opacity-50"
        >
          {busy ? "Cancelling…" : "Yes, cancel"}
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          disabled={busy}
          className="text-gray-500 hover:text-gray-700"
        >
          Keep it
        </button>
      </div>
    </div>
  );
}
