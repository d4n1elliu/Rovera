import Stripe from "stripe";

/* Lazy singleton, same pattern as the email client: importing this module
 * must not require a key, so builds and keyless environments still work. */

const globalForStripe = globalThis as unknown as { roveraStripe?: Stripe };

export function isStripeConfigured() {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

export function getStripe(): Stripe {
  if (!globalForStripe.roveraStripe) {
    // Placeholder keeps keyless envs working for webhook signature checks
    // (local crypto); actual API calls are gated by isStripeConfigured().
    globalForStripe.roveraStripe = new Stripe(
      process.env.STRIPE_SECRET_KEY ?? "sk_not_configured"
    );
  }
  return globalForStripe.roveraStripe;
}

/** Absolute base for Stripe's return URLs, which cannot be relative. */
export function siteUrl() {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}
