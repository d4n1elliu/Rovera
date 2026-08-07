import { NextResponse, type NextRequest } from "next/server";
import { ZodError } from "zod";
import { auth } from "@/auth";
import { submitReview } from "@/backend/services/review.service";

export const runtime = "nodejs";

// POST /api/reservations/:id/review — the signed-in renter rates their finished trip
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Not signed in" }, { status: 401 });
  }

  try {
    const outcome = await submitReview(params.id, session.user.id, await request.json());

    if (outcome === "created") return NextResponse.json({ success: true });
    const error =
      outcome === "already-reviewed"
        ? "You have already reviewed this trip."
        : "This trip cannot be reviewed.";
    return NextResponse.json({ success: false, error }, { status: 409 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors[0]?.message ?? "Invalid input" },
        { status: 422 }
      );
    }
    return NextResponse.json({ success: false, error: "Could not save the review" }, { status: 400 });
  }
}
