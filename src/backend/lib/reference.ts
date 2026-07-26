import { randomBytes } from "node:crypto";

/** Crockford base32 without I, L, O and U, so a reference read over the phone
 *  or typed from an email cannot be confused with a digit or another letter. */
const ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

const REFERENCE_LENGTH = 8;

/**
 * A human-readable booking reference, e.g. "RVR-8F3K2Q7M".
 *
 * Random rather than sequential, so a reference does not leak how many
 * bookings exist. `reference` carries a unique index, so a collision surfaces
 * as a write error rather than overwriting someone else's booking.
 */
export function generateBookingReference() {
  const bytes = randomBytes(REFERENCE_LENGTH);
  let reference = "";

  for (let i = 0; i < REFERENCE_LENGTH; i++) {
    reference += ALPHABET[bytes[i] % ALPHABET.length];
  }

  return `RVR-${reference}`;
}
