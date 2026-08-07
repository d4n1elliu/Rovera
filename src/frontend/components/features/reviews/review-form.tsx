"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/frontend/components/ui/button";
import { MAX_REVIEW_RATING } from "@/shared/constants";

/** Star picker plus optional comment for a finished trip. */
export function ReviewForm({ reservationId }: { reservationId: string }) {
  const router = useRouter();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (rating === 0) {
      setError("Pick a star rating first.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/reservations/${reservationId}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, comment: comment.trim() || undefined }),
      });
      const json = await res.json();
      if (!json.success) {
        setError(json.error ?? "Could not save the review.");
        return;
      }
      router.refresh();
    } catch {
      setError("Could not save the review.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600">Rate this trip:</span>
        <div className="flex" role="radiogroup" aria-label="Star rating">
          {Array.from({ length: MAX_REVIEW_RATING }, (_, i) => i + 1).map((star) => (
            <button
              key={star}
              type="button"
              role="radio"
              aria-checked={rating === star}
              aria-label={`${star} star${star === 1 ? "" : "s"}`}
              onClick={() => setRating(star)}
              className={`px-0.5 text-xl leading-none ${
                star <= rating ? "text-amber-500" : "text-gray-300 hover:text-amber-300"
              }`}
            >
              ★
            </button>
          ))}
        </div>
      </div>

      {rating > 0 && (
        <>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Anything worth knowing? (optional)"
            maxLength={500}
            rows={2}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand"
          />
          <Button size="sm" onClick={handleSubmit} disabled={busy}>
            {busy ? "Saving…" : "Submit review"}
          </Button>
        </>
      )}

      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
