# Rovera

Full-stack car rental platform built with Next.js, TypeScript, Prisma, MongoDB and Tailwind CSS.

## Getting started

```bash
npm install
cp .env.example .env.local   # then set DATABASE_URL
npm run db:push              # sync Prisma schema to MongoDB
npm run db:seed              # seed sample cars
npm run dev                  # http://localhost:3000
```

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
│   ├── repositories/   Data access — all Prisma queries live here
│   ├── prisma/         Data model (MongoDB) + seed script
│   └── db.ts           Prisma client singleton
│
├── shared/             Code used by BOTH sides
│   ├── schemas/        Zod validation (client forms + API handlers)
│   ├── types/          Shared TypeScript types
│   ├── utils.ts        formatPrice(), cn(), date helpers
│   └── constants.ts    Body types, fuel types, enums
│
└── middleware.ts       Route protection (account/rentals) once auth is added

public/                 Static assets (logo, car images)
```

Request flow: **page/route handler → backend service → repository → Prisma → MongoDB**.
Pages never touch Prisma directly; services own validation (Zod) and business rules.
`frontend/` code must never import from `backend/` — the only bridge is `app/`
(server components and API routes), and `shared/` is safe to import from anywhere.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm run db:push` | Push Prisma schema to the database |
| `npm run db:seed` | Seed sample data |

# Link
https://rovera1.vercel.app/
