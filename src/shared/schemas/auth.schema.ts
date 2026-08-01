import { z } from "zod";

/* ---------------------------------------------------------------------
 * Credentials, validated in one place.
 *
 * Shared so the sign-in and sign-up forms reject the same input the API
 * rejects, and a rule cannot be relaxed on one side without the other
 * noticing.
 * ------------------------------------------------------------------- */

/** Long enough to resist offline guessing once bcrypt has done its part.
 *  Length is the rule that actually helps; composition rules mostly push
 *  people toward predictable substitutions. */
export const MIN_PASSWORD_LENGTH = 10;

/** bcrypt ignores everything past 72 **bytes**, silently, so anything longer
 *  is half-checked without the owner knowing.
 *
 *  Measured in bytes rather than characters on purpose: 72 accented or CJK
 *  characters are well over 72 bytes, so a character limit would let a
 *  password through and then quietly use only the first part of it. */
export const MAX_PASSWORD_BYTES = 72;

/** UTF-8 byte length, without assuming Node's Buffer — this module is shared
 *  with the browser. */
function byteLength(value: string) {
  return new TextEncoder().encode(value).length;
}

const password = z
  .string()
  .min(MIN_PASSWORD_LENGTH, `Password must be at least ${MIN_PASSWORD_LENGTH} characters`)
  .refine(
    (value) => byteLength(value) <= MAX_PASSWORD_BYTES,
    `Password is too long (limit is ${MAX_PASSWORD_BYTES} bytes; accented and non-Latin characters count as more than one)`
  );

export const credentialsSchema = z.object({
  email: z.string().email("Enter a valid email"),
  // Not length-checked on sign-in: the rule may have changed since the
  // password was set, and the only thing that matters is whether it verifies.
  password: z.string().min(1, "Enter your password"),
});

export const registerSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required"),
  lastName: z.string().trim().min(1, "Last name is required"),
  email: z.string().email("Enter a valid email"),
  phone: z.string().trim().min(7, "Enter a valid phone number").optional(),
  password,
});

export type CredentialsInput = z.infer<typeof credentialsSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
