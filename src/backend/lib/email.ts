/**
 * The canonical form of an email address for storage and lookup.
 *
 * Every major provider treats mailboxes case-insensitively, so "A@b.com" and
 * "a@b.com" are one person — but Postgres text comparison is case-sensitive,
 * and without normalising, the guest-booking upsert would create a second
 * account for the same renter who happened to capitalise differently.
 *
 * Normalising on the way in means `users.email` can carry an ordinary unique
 * constraint (cheaper than a functional index, and inferable by ON CONFLICT),
 * and a CHECK in db/schema.ts enforces that nothing writes an unnormalised
 * address behind this function's back.
 *
 * Deliberately conservative: case and surrounding whitespace only. Stripping
 * dots or +suffixes would treat addresses their owners consider distinct as
 * the same account.
 */
export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}
