import { NextResponse, type NextRequest } from "next/server";
import { ZodError } from "zod";
import { clientIpFrom, rateLimit, tooManyRequests } from "@/backend/lib/rate-limit";
import { userRepository } from "@/backend/repositories/user.repository";
import { registerSchema } from "@/shared/schemas/auth.schema";

export const runtime = "nodejs";

// POST /api/auth/register — create an account, or claim an existing guest one
export async function POST(request: NextRequest) {
  // Tight: registration writes rows, burns bcrypt CPU, and probes addresses.
  const verdict = await rateLimit("register", clientIpFrom(request.headers), {
    limit: 5,
    windowSeconds: 600,
  });
  if (!verdict.allowed) return tooManyRequests(verdict.retryAfterSeconds);

  try {
    const input = registerSchema.parse(await request.json());
    const user = await userRepository.register(input);

    /* Null means the address already has a password.
     *
     * This response does tell a caller that the address is registered, and
     * that is a known limitation rather than an oversight: refusing is the
     * only honest answer available without an email-verification flow. The
     * alternative — always returning 201 and sending a "someone tried to
     * register your address" email — needs a verification path that does not
     * exist yet. Rate limiting is the mitigation until then.
     *
     * The wording is kept generic so the response body adds nothing the
     * status code has not already revealed. */
    if (!user) {
      return NextResponse.json(
        { success: false, error: "That email cannot be registered." },
        { status: 409 }
      );
    }

    // Never echo the row back — it carries passwordHash.
    return NextResponse.json(
      {
        success: true,
        data: { id: user.id, email: user.email, firstName: user.firstName },
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors[0]?.message ?? "Invalid input" },
        { status: 422 }
      );
    }
    return NextResponse.json(
      { success: false, error: "Could not create the account" },
      { status: 400 }
    );
  }
}
