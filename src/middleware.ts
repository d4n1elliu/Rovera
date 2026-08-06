import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import authConfig from "@/auth.config";
import { SIGN_IN_PATH } from "@/auth.config";

/* ---------------------------------------------------------------------
 * Route protection.
 *
 * This previously matched /account and /rentals and then returned
 * NextResponse.next() unconditionally, so both looked protected and were
 * not.
 *
 * Built from auth.config rather than auth.ts on purpose. Middleware runs in
 * the Edge runtime; importing the full config would pull the Credentials
 * provider, the user repository and postgres.js into this bundle, which
 * needs Node built-ins the Edge runtime does not have. The session is a JWT,
 * so deciding whether a request is authenticated is a signature check and
 * needs no database.
 *
 * This is a guard, not the guarantee. Middleware only sees requests matching
 * the config below, so API routes and server components verify the session
 * themselves rather than trusting that a request reached them legitimately.
 * ------------------------------------------------------------------- */

const { auth } = NextAuth(authConfig);

export default auth((request) => {
  if (request.auth) return NextResponse.next();

  // Carries where they were going, so they land there after signing in
  // rather than on the home page.
  const signIn = new URL(SIGN_IN_PATH, request.nextUrl.origin);
  signIn.searchParams.set("callbackUrl", request.nextUrl.pathname);
  return NextResponse.redirect(signIn);
});

export const config = {
  matcher: ["/account/:path*", "/rentals/:path*"],
};
