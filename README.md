# Rovera

Full-stack car rental platform. **Live at [www.rovera.org](https://www.rovera.org)**

## Tech Stack 

Next.js · TypeScript · PostgreSQL (Supabase) · Drizzle ORM · Tailwind CSS · NextAuth · Stripe · Resend

## Features

- **Fleet search** — filters, sorting, pagination and live availability, all resolved in SQL; booked cars are excluded before the page is cut.
- **Booking** — hourly windows, pickup/drop-off branch selection, DST-safe day billing, double-booking guard in the database.
- **Guest checkout that becomes an account** — book with just an email; registering later claims the same record, bookings intact.
- **Auth** — email/password (NextAuth, JWT sessions, bcrypt), protected account area.
- **Payments** — Stripe Checkout, amounts always priced server-side; the signed webhook (never the return URL) confirms bookings.
- **Cancellation with refunds** — renters cancel upcoming bookings; paid bookings are refunded through Stripe first, and a failed refund blocks the cancel.
- **Trip reviews** — star ratings on finished trips feed the real aggregates the fleet grid sorts by.
- **Promo codes** — enforced from the database: validity windows, redemption caps counted atomically inside the booking transaction.
- **Confirmation emails** — via Resend from `bookings@rovera.org`; a failed send never fails a booking, and the UI only claims an email that actually sent.
- **Rate limiting** — Postgres-backed fixed windows on register, sign-in, booking and checkout; fails open.
- **Defence in depth** — Supabase's public API is closed by RLS *and* revoked privileges, so one mistake can't expose data.

## Quick start

```bash
npm install          # then set DATABASE_URL in .env.local (Supabase pooler string, port 6543)
npm run db:migrate   # tables, enums, constraints, indexes, RLS
npm run db:seed      # branches, cars, promo codes, demo bookings
npm run dev          # http://localhost:3000
```

Only `DATABASE_URL` and `AUTH_SECRET` are needed to run. Everything else
degrades gracefully when absent.

## Environment variables

| Variable | Required | Without it |
| --- | --- | --- |
| `DATABASE_URL` | yes | — (use the **pooler**, port 6543; direct 5432 is IPv6-only and exhausts connections) |
| `AUTH_SECRET` | yes | auth endpoints 500 (`npx auth secret` to generate) |
| `STRIPE_SECRET_KEY` | for payments | checkout shows "pay at pickup", bookings stay `pending` |
| `STRIPE_WEBHOOK_SECRET` | for payments | webhook rejects; bookings never confirm |
| `RESEND_API_KEY` | for emails | send skipped, booking unaffected |
| `EMAIL_FROM` | no | falls back to Resend's sandbox sender (delivers only to the account owner) |
| `NEXT_PUBLIC_SITE_URL` | no | email/Stripe links fall back to `VERCEL_URL` |

Local scripts load `.env.local` then `.env` (Next.js precedence) via
`scripts/with-env.mjs`, so migrations, the seed and the app always target the
same database. Stripe needs a webhook endpoint for `checkout.session.completed`
and `checkout.session.expired` at `https://<site>/api/webhooks/stripe`; Resend
needs the domain verified. Test card: `4242 4242 4242 4242`.

## Architecture

```
src/
├── app/         Routing only — pages render frontend/, api/ calls backend/
├── frontend/    Browser code: components, hooks, config
├── backend/     Server-only: services (business rules) → repositories (all SQL)
│                → db/ (Drizzle client, schema, seed, aggregates), lib/ (email, payments, auth)
├── shared/      Both sides: Zod schemas, serialised types, constants, pricing
└── middleware.ts  Session gate for /account and /rentals
drizzle/         Generated SQL migrations — committed, never hand-edited
```

Request flow: **page/route → service → repository → Postgres**. `frontend/`
never imports `backend/`; `shared/` is safe anywhere.

`src/backend/db/schema.ts` is the single source of truth — tables, enums,
CHECK constraints, foreign keys, indexes and RLS in one file. `npm run
db:generate` diffs it into a numbered migration; `npm run db:migrate` applies
it. The database enforces the rules (types, FKs, ranges, one review per trip,
refunds never exceeding the charge) rather than trusting the application.

**Security model:** every table has RLS enabled with no policies (deny-all)
*and* `anon`/`authenticated` privileges revoked, including defaults for future
tables. The app connects as `postgres`, which bypasses both. When adding a
table, remember `.enableRLS()` so both layers hold.

## Deployment (Vercel)

`vercel-build = npm run db:migrate && next build` — deploys apply pending
migrations first, so a broken migration fails the build instead of shipping
mismatched code. `DATABASE_URL` is needed at build time; set every variable
for Production *and* Preview, and redeploy after changing any (they only take
effect on the next deployment).

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` / `build` | Dev server / production build |
| `npm run lint` / `typecheck` | ESLint / `tsc --noEmit` |
| `npm run db:generate` | Diff `schema.ts` into a new migration |
| `npm run db:migrate` | Apply pending migrations |
| `npm run db:seed` | Seed reference data + demo bookings (idempotent) |
| `npm run db:reset` | Truncate everything, then seed fresh |
