import type { CarRow, ReservationRow } from "@/backend/db/schema";
import { siteUrl, type EmailMessage } from "@/backend/lib/email/client";
import { formatDateTime, formatPrice } from "@/shared/utils";

/* ---------------------------------------------------------------------
 * The booking confirmation email.
 *
 * Built as HTML strings rather than components. Email clients render a
 * subset of HTML from roughly 2005 — no external stylesheets, no flexbox,
 * inline styles only — so a template here shares almost nothing with the
 * app's components, and a rendering library would add dependencies without
 * removing that constraint.
 *
 * Money and dates go through the same helpers the UI uses, so the figures in
 * the email and the figures on screen cannot disagree.
 * ------------------------------------------------------------------- */

/** Escapes text interpolated into the HTML body. A car description or a
 *  renter's name is not markup, and an apostrophe should not be able to
 *  break the layout. */
function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export interface BookingConfirmationData {
  reservation: ReservationRow;
  car: CarRow;
  firstName: string;
  to: string;
}

interface Line {
  label: string;
  value: string;
  /** Rendered heavier, for the amount actually charged. */
  strong?: boolean;
}

/** The price breakdown, with the rows that do not apply left out entirely —
 *  a renter over 25 with no promo code should not see two zeroed lines. */
function priceLines(reservation: ReservationRow): Line[] {
  const currency = reservation.currency;
  const lines: Line[] = [
    {
      label: `Rental (${reservation.days} ${reservation.days === 1 ? "day" : "days"})`,
      value: formatPrice(reservation.baseTotal, currency),
    },
  ];

  if (reservation.youngDriverFee > 0) {
    lines.push({
      label: "Young driver surcharge",
      value: formatPrice(reservation.youngDriverFee, currency),
    });
  }

  if (reservation.discount > 0) {
    lines.push({
      label: "Discount",
      value: `−${formatPrice(reservation.discount, currency)}`,
    });
  }

  lines.push({
    label: "Total",
    value: formatPrice(reservation.totalPrice, currency),
    strong: true,
  });

  return lines;
}

export function buildBookingConfirmation(data: BookingConfirmationData): EmailMessage {
  const { reservation, car, firstName, to } = data;

  const carName = `${car.year} ${car.make} ${car.model}`;
  const pickup = formatDateTime(reservation.pickupAt);
  const dropoff = formatDateTime(reservation.returnAt);
  const lines = priceLines(reservation);
  const rentalsUrl = `${siteUrl()}/rentals`;

  /* ------------------------------ plain text ------------------------- */

  const text = [
    `Hi ${firstName},`,
    "",
    `Your booking is confirmed. Your reference is ${reservation.reference} —`,
    "quote it if you need to get in touch about this rental.",
    "",
    `Car:     ${carName}`,
    `Pickup:  ${pickup}`,
    `Return:  ${dropoff}`,
    "",
    ...lines.map((line) => `${line.label.padEnd(28)} ${line.value}`),
    "",
    `See your bookings: ${rentalsUrl}`,
    "",
    "Rovera",
  ].join("\n");

  /* --------------------------------- html ---------------------------- */

  const rows = lines
    .map(
      (line) => `
          <tr>
            <td style="padding:6px 0;color:#4b5563;font-size:14px;">
              ${escapeHtml(line.label)}
            </td>
            <td align="right" style="padding:6px 0;font-size:14px;${
              line.strong ? "font-weight:700;color:#111827;" : "color:#111827;"
            }">
              ${escapeHtml(line.value)}
            </td>
          </tr>`
    )
    .join("");

  const detail = (label: string, value: string) => `
          <tr>
            <td style="padding:6px 0;color:#6b7280;font-size:14px;width:90px;">
              ${escapeHtml(label)}
            </td>
            <td style="padding:6px 0;color:#111827;font-size:14px;font-weight:600;">
              ${escapeHtml(value)}
            </td>
          </tr>`;

  const html = `<!doctype html>
<html lang="en">
  <body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
    <!-- Shown in the inbox list under the subject, so it repeats the one
         thing worth seeing without opening the message. -->
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">
      Booking ${escapeHtml(reservation.reference)} — ${escapeHtml(carName)}, ${escapeHtml(pickup)}
    </div>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:12px;overflow:hidden;">

            <tr>
              <td style="padding:28px 28px 8px;">
                <p style="margin:0 0 16px;font-size:18px;font-weight:700;color:#111827;">Rovera</p>
                <h1 style="margin:0 0 6px;font-size:22px;color:#111827;">Booking confirmed</h1>
                <p style="margin:0;font-size:14px;color:#4b5563;">
                  Hi ${escapeHtml(firstName)}, your ${escapeHtml(carName)} is booked.
                </p>
              </td>
            </tr>

            <tr>
              <td style="padding:20px 28px 0;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;">
                  <tr>
                    <td align="center" style="padding:16px;">
                      <p style="margin:0 0 4px;font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:#6b7280;">
                        Booking reference
                      </p>
                      <p style="margin:0;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:20px;font-weight:700;letter-spacing:.06em;color:#111827;">
                        ${escapeHtml(reservation.reference)}
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <tr>
              <td style="padding:20px 28px 0;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  ${detail("Car", carName)}
                  ${detail("Pickup", pickup)}
                  ${detail("Return", dropoff)}
                </table>
              </td>
            </tr>

            <tr>
              <td style="padding:12px 28px 0;">
                <hr style="border:none;border-top:1px solid #e5e7eb;margin:8px 0;" />
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows}
                </table>
              </td>
            </tr>

            <tr>
              <td style="padding:24px 28px 28px;">
                <a href="${rentalsUrl}"
                   style="display:inline-block;background:#111827;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:11px 20px;border-radius:8px;">
                  View my rentals
                </a>
                <p style="margin:18px 0 0;font-size:12px;color:#6b7280;line-height:1.5;">
                  Keep this reference — quote it if you need to get in touch about
                  this rental.
                </p>
              </td>
            </tr>

          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  return {
    to,
    // The reference is in the subject so the message is findable by search
    // later, which is what people actually do with a confirmation.
    subject: `Booking confirmed — ${reservation.reference}`,
    html,
    text,
  };
}
