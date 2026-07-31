import { Resend } from "resend";

/* ---------------------------------------------------------------------
 * Outbound email.
 *
 * Sending is optional by design. A booking is a database write that has
 * already succeeded by the time anything here runs, and a transient failure
 * at an email provider is not a reason to tell a renter their booking did not
 * happen. So every path through this module reports what it did and never
 * throws — callers decide what to say, and the booking stands either way.
 *
 * With no RESEND_API_KEY the module is inert: it reports `not-configured`
 * rather than failing, which keeps local development and CI free of a
 * credential they have no use for.
 *
 * The client is constructed lazily and cached, for the same reason the
 * database client is — `next build` loads every route module to analyse it,
 * and throwing on a missing key at import time would make the build depend on
 * configuration it does not need.
 * ------------------------------------------------------------------- */

const globalForEmail = globalThis as unknown as { roveraResend?: Resend };

/**
 * Where confirmations come from.
 *
 * Resend will only deliver to arbitrary recipients from a domain you have
 * verified. `onboarding@resend.dev` is their shared sandbox sender, which
 * works immediately but can only reach the address that owns the API key —
 * enough to see the flow end to end before a domain exists.
 */
const FROM = process.env.EMAIL_FROM ?? "Rovera <onboarding@resend.dev>";

/** Absolute base for links in emails, which cannot be relative. */
export function siteUrl() {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  // Set by Vercel on every deployment, without a scheme.
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

export function isEmailConfigured() {
  return Boolean(process.env.RESEND_API_KEY);
}

function getClient() {
  if (!globalForEmail.roveraResend) {
    globalForEmail.roveraResend = new Resend(process.env.RESEND_API_KEY);
  }
  return globalForEmail.roveraResend;
}

export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  /** Always supplied alongside the HTML: some clients prefer it, and spam
   *  filters treat an HTML-only message as a signal. */
  text: string;
}

export type SendResult =
  | { sent: true; id: string | null }
  | { sent: false; reason: "not-configured" | "failed"; error?: string };

/**
 * Sends a message, and reports the outcome rather than throwing.
 *
 * Awaited rather than left running in the background: on a serverless
 * platform the function can be frozen the moment its response is returned, so
 * a floating promise is not reliably delivered. The added latency is a fair
 * price on a request the renter already expects to take a moment.
 */
export async function sendEmail(message: EmailMessage): Promise<SendResult> {
  if (!isEmailConfigured()) {
    if (process.env.NODE_ENV !== "production") {
      console.info(
        `[email] RESEND_API_KEY not set — would have sent "${message.subject}" to ${message.to}`
      );
    }
    return { sent: false, reason: "not-configured" };
  }

  try {
    const { data, error } = await getClient().emails.send({
      from: FROM,
      to: message.to,
      subject: message.subject,
      html: message.html,
      text: message.text,
    });

    // Resend reports delivery problems in the payload rather than by throwing.
    if (error) {
      console.error(`[email] send failed: ${error.message}`);
      return { sent: false, reason: "failed", error: error.message };
    }

    return { sent: true, id: data?.id ?? null };
  } catch (cause) {
    // Network failure, bad credentials, provider outage.
    const error = cause instanceof Error ? cause.message : String(cause);
    console.error(`[email] send threw: ${error}`);
    return { sent: false, reason: "failed", error };
  }
}
