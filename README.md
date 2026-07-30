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

If you access the tables only through the app (Drizzle, server-side), enable
Row Level Security on every table so Supabase's public Data API can't be used to
read or write them directly with the anon key:

```sql
alter table cars enable row level security;
-- ...repeat for locations, reservations, users, payments, reviews, promo_codes
```

Drizzle connects as the `postgres` role and bypasses RLS, so the app keeps
working with RLS on and no policies.

### Environment files

Next.js loads `.env.local` in preference to `.env`. Standalone scripts load
neither on their own, so every `db:*` script runs through
`scripts/with-env.mjs`, which applies the same precedence before handing off.
That keeps migrations, the seed and the running app pointed at the same
database. Real environment variables (Vercel, CI) still win over both files.

Set `DB_LOGGING=true` to have every SQL statement logged.

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
│   ├── lib/            Server-only helpers (booking references, serialisation)
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

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run db:generate` | Diff `schema.ts` into a new SQL migration under `drizzle/` |
| `npm run db:migrate` | Apply pending migrations — create tables, enums, constraints and indexes |
| `npm run db:seed` | Seed reference data and demo bookings (idempotent) |
| `npm run db:reset` | Truncate every table, then seed from scratch |

## Link

| https://rovera1.vercel.app/ |
