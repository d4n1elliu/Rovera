import type { NextAuthConfig } from "next-auth";
import type { UserRole } from "@/shared/constants";

/* ---------------------------------------------------------------------
 * The part of the auth config that must run on the Edge.
 *
 * Middleware runs in the Edge runtime, which has no `net`, `tls` or
 * `perf_hooks`. Importing the full config there pulls in the Credentials
 * provider, which reaches the user repository, which loads postgres.js —
 * and the build then warns that a pile of Node built-ins are unavailable.
 *
 * So the config is split. Everything here is pure: session strategy,
 * callbacks that only reshape a token, and where to send a signed-out
 * visitor. The Credentials provider — the only piece that touches the
 * database — is added in auth.ts, which is imported solely from Node
 * contexts.
 *
 * Middleware can still make its decision from this alone: the session is a
 * JWT, so establishing whether a request is authenticated is a signature
 * check, not a query.
 * ------------------------------------------------------------------- */

/**
 * Where an unauthenticated visitor is sent.
 *
 * NextAuth's own page for now, so this works before any UI exists. Point it
 * at "/signin" and set `pages.signIn` below once the app has its own form —
 * one constant, so middleware and every server component follow.
 */
export const SIGN_IN_PATH = "/api/auth/signin";

export default {
  session: { strategy: "jwt" },

  // Filled in by auth.ts. Middleware only reads an existing session, so it
  // never needs a provider to do its job.
  providers: [],

  callbacks: {
    /* Runs on sign-in and on every token refresh. Whatever is put here is
     * what a session can contain, because with a JWT strategy there is no
     * database lookup afterwards. */
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.firstName = user.firstName;
        token.lastName = user.lastName;
      }
      return token;
    },

    async session({ session, token }) {
      session.user.id = token.id as string;
      session.user.role = token.role as UserRole;
      session.user.firstName = token.firstName as string;
      session.user.lastName = token.lastName as string;
      return session;
    },
  },
} satisfies NextAuthConfig;
