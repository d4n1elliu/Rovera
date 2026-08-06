import "server-only";
import { eq } from "drizzle-orm";
import { getDb } from "@/backend/db/client";
import { users, type UserRow } from "@/backend/db/schema";
import { normalizeEmail } from "@/backend/lib/email";
import { hashPassword } from "@/backend/lib/auth/password";

/* ---------------------------------------------------------------------
 * Accounts.
 *
 * Every lookup goes through normalizeEmail, the same function the booking
 * flow uses, so signing in, signing up and booking as a guest all resolve to
 * one row rather than three.
 * ------------------------------------------------------------------- */

export const userRepository = {
  async findByEmail(email: string): Promise<UserRow | null> {
    const [user] = await getDb()
      .select()
      .from(users)
      .where(eq(users.email, normalizeEmail(email)))
      .limit(1);
    return user ?? null;
  },

  async findById(id: string): Promise<UserRow | null> {
    const [user] = await getDb().select().from(users).where(eq(users.id, id)).limit(1);
    return user ?? null;
  },

  /**
   * Creates an account, or claims the guest record that already exists for
   * this address.
   *
   * A renter who booked without signing up already has a row — created by the
   * reservation flow with `passwordHash` null. Signing up later must attach a
   * password to that row rather than insert a second one, or their existing
   * bookings would belong to an account they cannot sign in to. That is the
   * whole reason the auth columns are nullable.
   *
   * Returns null when the address already has a password, which is a genuine
   * conflict: someone is trying to register over a real account.
   */
  async register(input: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    password: string;
  }): Promise<UserRow | null> {
    const db = getDb();
    const email = normalizeEmail(input.email);
    const passwordHash = await hashPassword(input.password);
    const now = new Date();

    return db.transaction(async (tx) => {
      const [existing] = await tx
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (existing) {
        // Already a real account — the caller decides what to tell them.
        if (existing.passwordHash) return null;

        /* Claiming a guest row. The names they register with win, because
         * they are typing them deliberately now rather than into a booking
         * form. The phone is only overwritten when supplied. */
        const [claimed] = await tx
          .update(users)
          .set({
            firstName: input.firstName,
            lastName: input.lastName,
            phone: input.phone ?? existing.phone,
            passwordHash,
            updatedAt: now,
          })
          .where(eq(users.id, existing.id))
          .returning();

        return claimed;
      }

      const [created] = await tx
        .insert(users)
        .values({
          firstName: input.firstName,
          lastName: input.lastName,
          email,
          phone: input.phone ?? null,
          passwordHash,
          role: "customer",
          createdAt: now,
          updatedAt: now,
        })
        .returning();

      return created;
    });
  },

  async setPassword(userId: string, password: string) {
    const passwordHash = await hashPassword(password);
    await getDb()
      .update(users)
      .set({ passwordHash, updatedAt: new Date() })
      .where(eq(users.id, userId));
  },
};
