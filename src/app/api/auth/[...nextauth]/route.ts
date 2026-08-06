import { handlers } from "@/auth";

/* NextAuth's own endpoints — sign in, sign out, session, CSRF. Everything is
 * configured in src/auth.ts; this only exposes it over HTTP. */
export const { GET, POST } = handlers;

export const runtime = "nodejs";
