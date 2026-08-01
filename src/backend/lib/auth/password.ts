import bcrypt from "bcryptjs";

/* ---------------------------------------------------------------------
 * Password hashing.
 *
 * bcrypt rather than a hand-rolled KDF: it is the unsurprising choice, it
 * carries its cost factor and salt inside the hash string, and a reader does
 * not have to audit bespoke crypto to trust it. bcryptjs specifically, over
 * the native binding, because it is pure JavaScript and so needs no build
 * step on a serverless platform.
 * ------------------------------------------------------------------- */

/* Cost factor. Each increment doubles the work. 12 is roughly a quarter of a
 * second on current hardware — slow enough to make offline guessing painful,
 * fast enough that signing in does not feel broken. Stored inside the hash,
 * so raising it later does not invalidate existing passwords: they simply
 * keep verifying at the cost they were written with. */
const COST = 12;

export async function hashPassword(plain: string) {
  return bcrypt.hash(plain, COST);
}

/**
 * Checks a password against a stored hash.
 *
 * Returns false rather than throwing for an account with no password set —
 * a guest who booked by email alone has `passwordHash` null, and that is a
 * failed sign-in, not an error.
 */
export async function verifyPassword(plain: string, hash: string | null) {
  if (!hash) {
    /* Still spend the time. Returning immediately would make "no account" and
     * "wrong password" distinguishable by how long the request took, which
     * turns the sign-in form into a way to enumerate who has an account. */
    await bcrypt.compare(plain, DUMMY_HASH);
    return false;
  }
  return bcrypt.compare(plain, hash);
}

/** A real bcrypt hash of a value nobody will guess, used only to burn the
 *  same time a genuine comparison would. */
const DUMMY_HASH = "$2b$12$C6UzMDM.H6dfI/f/IKcEe.9nkOL3PQKlN0i6cQjUw7ZQnCXjZ7ZQK";
