# Rovera

Full-stack car rental platform built with Next.js, TypeScript, MongoDB and Tailwind CSS.

## Getting started

```bash
npm install
# set DATABASE_URL in .env.local
npm run db:indexes           # create collections, validators and indexes
npm run db:seed              # seed locations, cars, promo codes and demo bookings
npm run dev                  # http://localhost:3000
```

MongoDB must be a **replica set**, even locally — transactions (the booking
double-booking guard) do not work against a standalone `mongod`:

```bash
brew services start mongodb-community
mongosh --eval 'rs.initiate()'
```

### Environment files

Next.js loads `.env.local` in preference to `.env`. Standalone scripts load
neither on their own, so every `db:*` script runs through
`scripts/with-env.mjs`, which applies the same precedence before handing off.
That keeps the seed and the running app pointed at the same database. Real
environment variables (Vercel, CI) still win over both files.

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
│   ├── repositories/   Data access — all MongoDB queries live here
│   ├── db/             client.ts (MongoClient singleton), schema.ts (document
│   │                   types + $jsonSchema validators), indexes.ts, seed.ts
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

public/                 Static assets (logo, car images)
```

Request flow: **page/route handler → backend service → repository → MongoDB**.
Pages never query MongoDB directly; services own validation (Zod) and business
rules, and repositories own every query.

`frontend/` code must never import from `backend/` — the only bridge is `app/`
(server components and API routes), and `shared/` is safe to import anywhere.

### The data model

`src/backend/db/schema.ts` is the single source of truth. Each collection is
described three ways, meant to be read together:

1. A `*Doc` interface — the shape MongoDB stores, ObjectIds and Dates included;
2. A `$jsonSchema` validator — the same rules enforced by the database, so a
   stray script cannot write a malformed document;
3. index definitions in `indexes.ts`, including the unique constraints the
   model depends on.

Enum values come from `shared/constants.ts` rather than being redeclared, so
the database, the Zod schemas and the UI cannot drift apart.

Documents are serialised at the backend boundary (`backend/lib/serialize.ts`):
ObjectIds become hex strings and Dates become ISO strings, so everything in
`shared/types` is JSON-safe and can cross a server-component boundary.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run db:indexes` | Create collections, apply validators, build indexes |
| `npm run db:seed` | Seed reference data and demo bookings (idempotent) |
| `npm run db:reset` | Drop every collection, then seed from scratch |

## Link
https://rovera1.vercel.app/
