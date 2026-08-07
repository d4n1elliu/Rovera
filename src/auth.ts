import NextAuth, { type DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import authConfig from "@/auth.config";
import { clientIpFrom, rateLimit } from "@/backend/lib/rate-limit";
import { userRepository } from "@/backend/repositories/user.repository";
import { verifyPassword } from "@/backend/lib/auth/password";
import { credentialsSchema } from "@/shared/schemas/auth.schema";
import type { UserRole } from "@/shared/constants";

/* ---------------------------------------------------------------------
 * Authentication — the full configuration.
 *
 * Email and password against the `users` table, with the session carried in
 * a signed JWT rather than a database table.
 *
 * This module reaches the database, so it must only be imported from Node
 * contexts: route handlers, server components, server actions. Middleware
 * imports auth.config.ts instead — see the note there.
 *
 * JWT rather than database sessions is a deliberate fit with the existing
 * model. An adapter would require its own `accounts`, `sessions` and
 * `verificationTokens` tables and expects a `users` shape this schema does
 * not have — it wants a single `name`, where a rental needs the renter's
 * first and last separately. It would also add a query to every request.
 * Nothing here needs server-side revocation yet, which is the one thing
 * database sessions buy.
 *
 * `passwordHash` being nullable is what lets a guest booking become an
 * account: the reservation flow creates the row, signing up fills it in.
 * See userRepository.register.
 * ------------------------------------------------------------------- */

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: UserRole;
      firstName: string;
      lastName: string;
    } & DefaultSession["user"];
  }

  interface User {
    role: UserRole;
    firstName: string;
    lastName: string;
  }
}

export { SIGN_IN_PATH } from "@/auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,

  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },

      async authorize(raw, request) {
        // Throttled by IP before any hashing: sign-in is the brute-force surface.
        const verdict = await rateLimit("signin", clientIpFrom(request.headers), {
          limit: 10,
          windowSeconds: 600,
        });
        if (!verdict.allowed) return null;

        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) return null;

        const user = await userRepository.findByEmail(parsed.data.email);

        /* verifyPassword still runs a comparison when the account does not
         * exist, so a wrong address and a wrong password take the same time.
         * Otherwise the form becomes a way to discover who has an account. */
        const valid = await verifyPassword(
          parsed.data.password,
          user?.passwordHash ?? null
        );

        if (!user || !valid) return null;

        // Only what the session needs. The hash never leaves this function.
        return {
          id: user.id,
          email: user.email,
          name: `${user.firstName} ${user.lastName}`.trim(),
          image: user.image,
          role: user.role,
          firstName: user.firstName,
          lastName: user.lastName,
        };
      },
    }),
  ],
});
