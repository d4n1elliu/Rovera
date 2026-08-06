# Rovera

Fullstack car rental platform built with Next.js, TypeScript, PostgreSQL (Supabase) and Tailwind CSS with Drizzle ORM as the data layer.

## Getting started

```bash
npm install                  # set DATABASE_URL in .env.local  (your Supabase Postgres connection string)
npm run db:migrate           # apply migrations — create tables, enums, constraints and indexes
npm run db:seed              # seed locations, cars, promo codes and demo bookings
npm run dev                  # http://localhost:3000
```

### Database

The database is PostgreSQL, hosted on **Supabase**. Grab your `DATABASE_URL`
from the Supabase dashboard under **Connect → ORMs (Drizzle)** and put it in
`.env.local`.

Unlike the previous MongoDB setup, no special local configuration is needed:
Postgres has native transactions, so the booking double booking guard works out
of the box, which means there is no replica set to initialise.

Supabase's public Data API is locked off by the migrations — nothing to switch
on by hand. See [Locking off the public API](#locking-off-the-public-api).

### Environment files

Next.js loads `.env.local` in preference to `.env`. Standalone scripts load
neither on their own, so every `db:*` script runs through
`scripts/with-env.mjs`, which applies the same precedence before handing off.
That keeps migrations, the seed and the running app pointed at the same
database. Real environment variables (Vercel, CI) still win over both files.

Set `DB_LOGGING=true` to have every SQL statement logged.

### Authentication

Email and password, via NextAuth, against the existing `users` table.

| Variable | Required | Purpose |
| --- | --- | --- |
| `AUTH_SECRET` | **yes** | Signs the session JWT. Generate with `npx auth secret`. |
| `AUTH_URL` | on Vercel only if the URL is not auto-detected | Canonical site URL |

Sessions are JWTs rather than database rows. A database adapter would need
its own `accounts`, `sessions` and `verificationTokens` tables and expects a
`users` shape this schema does not have — it wants one `name` field, where a
rental needs first and last separately. It would also add a query per
request. Nothing here needs server-side session revocation yet, which is the
one thing database sessions buy.

**Guest bookings become accounts.** `users.passwordHash` is nullable on
purpose: booking without signing up creates the row, and registering later
fills that same row in rather than inserting a second one — so a renter's
existing bookings are still theirs. Registering against an address that
already has a password is refused.

`/account` and `/rentals` are gated in `src/middleware.ts`, and the API
routes and server components check the session themselves as well.
Middleware only sees requests matching its config, so anything reading one
renter's data confirms who is asking rather than assuming.

### Confirmation emails

A booking confirmation is sent through [Resend](https://resend.com) after the
reservation is written.

| Variable | Required | Purpose |
| --- | --- | --- |
| `RESEND_API_KEY` | to send at all | Resend API key |
| `EMAIL_FROM` | no | Sender, e.g. `Rovera <bookings@yourdomain>`. Defaults to Resend's sandbox sender. |
| `NEXT_PUBLIC_SITE_URL` | no | Absolute base for links in emails. Falls back to `VERCEL_URL`, then localhost. |

**Sending is optional.** With no `RESEND_API_KEY` the module is inert: the
booking still succeeds, the send is skipped, and in development it logs the
message it would have sent. Local work and CI need no credential.

A send never fails a booking. The reservation is already committed by the
time the email is attempted, and a provider outage is not a reason to tell a
renter their booking did not happen — so failures are logged and reported,
never thrown.

Whether the email actually went out is carried back to the confirmation
screen, which mentions the email only when one was really sent. This screen
previously told every renter an email was on its way when nothing sent email
at all; making the claim conditional is what stops that recurring in an
environment without a key.

Resend only delivers to arbitrary recipients from a **verified domain**. Its
sandbox sender works immediately but reaches only the address that owns the
API key — enough to watch the flow end to end before a domain exists.

### Payments

Card payment via Stripe Checkout (hosted page), taken after booking.

| Variable | Required | Purpose |
| --- | --- | --- |
| `STRIPE_SECRET_KEY` | to take payment | Stripe secret key (`sk_test_…` in test mode) |
| `STRIPE_WEBHOOK_SECRET` | to confirm bookings | Signing secret for the `/api/webhooks/stripe` endpoint |

Without keys the flow degrades: checkout shows the price breakdown with a
"pay at pickup" note and bookings stay `pending`. With keys, paying moves the
payment to `succeeded` and the reservation to `confirmed` — driven by the
signed webhook, never by the browser's return URL. Amounts always come from
the reservation row, so the client cannot change what is charged.

In the Stripe dashboard add a webhook endpoint for
`checkout.session.completed` and `checkout.session.expired` pointing at
`https://<site>/api/webhooks/stripe`. Test cards: `4242 4242 4242 4242`, any
future expiry, any CVC.

## Architecture

```
src/
├── app/                Routing layer only — pages render frontend/ components,
│                       api/ routes call backend/ services
│
├── frontend/           Everything that runs in the browser
│   ├── components/     ui/ primitives, layout/ (navbar, footer), features/ domain components
│   ├── hooks/          Client-side React hooks (use-cars, use-debounce)
│   └── config/         Site name, nav links, metadata
│
├── backend/            Everything server-side (never shipped to the browser)
│   ├── services/       Business logic / use-cases (createReservation, getCars, …)
│   ├── repositories/   Data access — all Drizzle queries live here
│   ├── db/             client.ts (Drizzle + postgres.js client), schema.ts (table
│   │                   definitions, enums, constraints, indexes), seed.ts,
│   │                   aggregates.ts (denormalised review aggregates)
│   ├── lib/            Server-only helpers (booking references, serialisation,
│   │                   email/ — Resend client + confirmation template)
│   └── data/           Seed fixtures (cars.json)
│
├── shared/             Code used by BOTH sides
│   ├── schemas/        Zod validation (client forms + API handlers)
│   ├── types/          Serialised shapes the frontend sees
│   ├── utils.ts        formatPrice(), cn(), date helpers
│   └── constants.ts    Body types, fuel types, statuses, roles
│
└── middleware.ts       Route protection (account/rentals) once auth is added

drizzle/                Generated SQL migrations + snapshots (drizzle-kit output)
public/                 Static assets (logo, car images)
```

Request flow: **page/route handler → backend service → repository → Postgres (via Drizzle)**.
Pages never query the database directly; services own validation (Zod) and
business rules, and repositories own every query.

`frontend/` code must never import from `backend/` — the only bridge is `app/`
(server components and API routes) and `shared/` is safe to import anywhere.

### The data model

`src/backend/db/schema.ts` defines every table in one place.
Running `npm run db:generate` turns any change to that file
into a numbered SQL migration in `drizzle/` and `npm run db:migrate` applies it.

The database enforces its own rules, so bad data simply can't get in:

- **Types & required fields**: a missing or wrong-typed value is rejected.
- **Foreign keys**: a booking must point to a real car and user, and you can't delete a car that still has bookings.
- **Enums & checks**: only valid values are allowed (body types, statuses, non-negative prices and so on).

Enum values live in `shared/constants.ts`, so the database, the forms, and the
UI always agree. Postgres columns are snake_case and TypeScript is camelCase and
Drizzle maps between them automatically. Before data reaches the frontend it's
serialised into JSON-safe shapes: prices as numbers, dates as ISO strings.

### Locking off the public API

Supabase publishes a REST API over `public` to anyone holding the anon key,
which is a value that ships to browsers. Nothing here uses it — every query
goes through the repositories, which connect as `postgres`. So the database is
closed to that path entirely, by two independent migrations:

| Migration | Layer | Effect |
| --- | --- | --- |
| `0001` | Row level security | Every table has RLS on and **no policies**. RLS with no policy denies everyone. |
| `0002` | Privileges | `anon` and `authenticated` have their table, sequence and function privileges revoked, including the default privileges that would otherwise apply to future tables. |

Either alone would do the job today. Both are there because one mistake should
not be enough to expose the data: with only RLS, a single `disable row level
security` or one over-broad policy reopens everything; with only the revoke, a
stray `grant` does the same. An attacker with the anon key now hits
`permission denied` before RLS is even consulted.

`postgres` bypasses both — it owns the tables and holds `BYPASSRLS` — so the
app is unaffected. `service_role` is left intact as the escape hatch for
trusted server-side tooling.

Two consequences worth knowing:

- **A new table is not automatically protected by RLS.** `0002` means it will
  at least have no anon privileges, but remember `.enableRLS()` on the table in
  `schema.ts` so both layers hold.
- **If you ever do want browser-side Supabase queries**, this is what you undo:
  grant the privilege back and write an actual RLS policy. Both are deliberate
  steps rather than defaults you have inherited.

## Deployment (Vercel)

Set one environment variable in the Vercel project, for every environment that
should reach the database:

| Variable | Value |
| --- | --- |
| `DATABASE_URL` | The Supabase **pooler** string, port `6543` |

Use the pooler, not the direct connection on 5432. Each serverless function
keeps its own pool, so the direct port runs into Postgres' connection limit as
soon as a handful are warm. `db/client.ts` detects a `pooler.supabase.com` host
and turns off prepared statements, which pgBouncer's transaction mode cannot
support.

Migrations run as part of the build. Vercel prefers a `vercel-build` script
over `build` when one exists, so:

```
vercel-build = npm run db:migrate && next build
```

means a deploy applies pending migrations before it compiles, and a failed
migration fails the build instead of shipping code that expects a table that
does not exist yet. Local `npm run build` is left alone, so it stays fast and
needs no database.

Two things to know:

- The build needs `DATABASE_URL` at **build** time, not just at runtime.
- Deploys are assumed not to run concurrently. Two builds migrating the same
  database at once is not protected against; if that becomes a possibility,
  move migrations to a release step that runs once.

The seed is deliberately not part of the build — it is development fixture
data. Run `npm run db:seed` by hand against an environment that wants it.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run vercel-build` | What Vercel runs — migrate, then build |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run db:generate` | Diff `schema.ts` into a new SQL migration under `drizzle/` |
| `npm run db:migrate` | Apply pending migrations — create tables, enums, constraints and indexes |
| `npm run db:seed` | Seed reference data and demo bookings (idempotent) |
| `npm run db:reset` | Truncate every table, then seed from scratch |

## Link

| https://rovera1.vercel.app/ |
