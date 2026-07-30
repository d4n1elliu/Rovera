# Rovera

Full-stack car rental platform built with Next.js, TypeScript, PostgreSQL
(Supabase) and Tailwind CSS.

## Getting started

```bash
npm install
# set DATABASE_URL in .env.local
npm run db:migrate           # apply the schema
npm run db:seed              # seed locations, cars, promo codes and demo bookings
npm run dev                  # http://localhost:3000
```

### Connecting to Supabase

Take the connection string from **Project settings → Database → Connection
pooling** and put it in `.env.local`:

```
DATABASE_URL=postgresql://postgres.<project-ref>:<password>@aws-0-<region>.pooler.supabase.com:6543/postgres
```

Use the **pooler** host (port 6543), not the direct connection on 5432. Every
serverless function gets its own pool, and the direct port exhausts Postgres'
connection limit as soon as more than a handful are warm.

The pooler runs pgBouncer in transaction mode, where named prepared statements
do not survive between statements. `src/backend/db/client.ts` detects a
`pooler.supabase.com` host and disables them, so pointing `DATABASE_URL` at a
local Postgres instead needs no other change:

```bash
docker run -d --name rovera-pg -p 5432:5432 \
  -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=rovera postgres:16
# DATABASE_URL=postgresql://postgres:postgres@localhost:5432/rovera
```

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
│   ├── repositories/   Data access — every SQL query lives here
│   ├── db/             client.ts (postgres.js pool + Drizzle handle),
│   │                   schema.ts (tables, constraints, indexes),
│   │                   aggregates.ts, seed.ts
│   ├── lib/            Server-only helpers (booking references, serialisation)
│   └── data/           Seed fixtures
│
├── shared/             Code used by BOTH sides
│   ├── schemas/        Zod validation (client forms + API handlers)
│   ├── types/          Serialised shapes the frontend sees
│   ├── utils.ts        formatPrice(), cn(), date helpers
│   └── constants.ts    Body types, fuel types, statuses, roles
│
└── middleware.ts       Route protection (account/rentals) once auth is added

drizzle/                Generated SQL migrations — committed, never hand-edited
public/                 Static assets (logo, car images)
```

Request flow: **page/route handler → backend service → repository →
PostgreSQL**. Pages never query the database directly; services own validation
(Zod) and business rules, and repositories own every query.

`frontend/` code must never import from `backend/` — the only bridge is `app/`
(server components and API routes), and `shared/` is safe to import anywhere.

### The data model

`src/backend/db/schema.ts` is the single source of truth: tables, columns,
constraints, indexes and relations in one file. `drizzle-kit` diffs it against
the migrations already generated and writes the difference to `drizzle/` as
plain SQL, so a schema change is reviewable as SQL and applied identically in
every environment.

Four things the database enforces, rather than trusting the application to get
them right:

1. **Column types and NOT NULL** — a missing field is a write error, not a
   silently malformed row.
2. **Foreign keys** — a reservation cannot reference a car that does not exist,
   and deleting a car that has bookings is refused.
3. **CHECK constraints** — the ranges the pricing and booking logic assume: a
   rental ends after it starts, totals are non-negative, a rating is 1–5, a
   promotion is a percentage *or* a fixed amount, an email is stored lower case.
4. **Enums** — real Postgres enum types, so an invalid status is rejected.

Enum values come from `shared/constants.ts` rather than being redeclared, so
the database, the Zod schemas and the UI cannot drift apart.

Money is stored as `numeric(10, 2)` and converted to a JS `number` at the
driver boundary by the `money` type in `schema.ts` — exact in the database,
ergonomic in TypeScript.

Rows are serialised at the backend boundary (`backend/lib/serialize.ts`): Dates
become ISO strings, so everything in `shared/types` is JSON-safe and can cross
a server-component boundary. Primary keys are UUID text on both sides and need
no conversion.

### Changing the schema

```bash
# 1. edit src/backend/db/schema.ts
npm run db:generate          # writes drizzle/NNNN_*.sql
# 2. read the generated SQL
npm run db:migrate           # apply it
```

Commit the generated migration alongside the schema change. Never edit an
applied migration — add a new one.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run db:generate` | Diff `schema.ts` into a new SQL migration |
| `npm run db:migrate` | Apply pending migrations |
| `npm run db:studio` | Browse the database in Drizzle Studio |
| `npm run db:seed` | Seed reference data and demo bookings (idempotent) |
| `npm run db:reset` | Truncate every table, then seed from scratch |

# Link
https://rovera1.vercel.app/
