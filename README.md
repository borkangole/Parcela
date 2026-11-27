# Parcela

Real estate management system for **AAAC Corporation**, starting with the Costa Preciosa project.

- **Admin side** (owner, admin, accountant, staff): lots, reservations, buyer records, payments, reports.
- **Agents** (phone): check available lots and log client inquiries.
- **Buyers** never log in. They are records only.

| | |
|---|---|
| Phase 1 (live **Dec 15, 2026**) | Login and roles, lot inventory, agents, buyers, inquiries, reservations and contracts, accounting |
| Phase 2 (by **Jan 16, 2027**) | Lot map, calendar, analytics dashboard, reports, agent mobile view |

## Tech stack

| Layer | Tool |
|---|---|
| App | Next.js 16 (App Router), React 19, TypeScript |
| Styling | Tailwind CSS 4, shadcn/ui |
| Database | PostgreSQL 17 with PostGIS |
| ORM / migrations | Drizzle ORM + drizzle-kit |
| Hosting | DigitalOcean (Singapore) + Coolify, domain parcela.ph |

## Requirements

- [Node.js 22 LTS](https://nodejs.org)
- [PostgreSQL](https://www.postgresql.org/download/) 14 or newer, installed locally
- [Git](https://git-scm.com)

## First-time setup

1. In pgAdmin (or `psql`), create an empty database named `parcela`.
2. Then run:

```bash
npm install
cp .env.example .env          # Windows PowerShell: copy .env.example .env
                              # then open .env: put in your PostgreSQL password and a
                              # BETTER_AUTH_SECRET (see the comment in .env)
npm run db:migrate            # create the tables
npm run db:seed               # load Costa Preciosa (39 lots)
npm run create-admin -- "Your Name" you@example.com "a-strong-password"   # first login
npx shadcn@latest init        # one time: set up shadcn/ui (pick the defaults)
npm run dev                   # http://localhost:3000
```

The home page should show **Costa Preciosa: 37 available, 2 unavailable** (lots P and Q are on hold).

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the app in development mode |
| `npm run build` / `npm start` | Production build / run it |
| `npm run lint` / `npm run typecheck` | Check code style / TypeScript types |
| `npm run db:generate` | Create a migration after you change `src/db/schema.ts` |
| `npm run db:migrate` | Apply migrations to the database |
| `npm run db:seed` | Load the Costa Preciosa lots (safe to run again) |
| `npm run db:studio` | Browse the database in your browser |
| `npm run create-admin -- "Name" email "password"` | Create an Admin account (the first one, or any time) |

## Folder structure

```
drizzle/            SQL migrations (generated; commit them)
src/
  app/              pages and routes (Next.js App Router)
  components/ui/    shadcn/ui components (after `shadcn init`)
  db/
    schema.ts       all tables
    index.ts        database connection (import { db } from "@/db")
    seed.ts         Costa Preciosa seed data
```

### Optional: database in Docker

If you'd rather not use an installed PostgreSQL, `docker-compose.yml` runs one in Docker:
`npm run db:up` to start, `npm run db:down` to stop, and use
`DATABASE_URL="postgresql://parcela:parcela@localhost:5432/parcela"` in `.env`.

## Login and roles

- Two roles: **Admin** (everything) and **Agent** (lots, their own inquiries, buyers and sales).
  The rules live in `src/lib/permissions.ts`; more roles can be added there later.
- Nobody signs themselves up. Admins create every account.
- `src/proxy.ts` sends anyone not logged in to `/login`. Every page still checks access itself with
  `requireUser()` or `requirePermission({ ... })` from `src/lib/session.ts`.

## Changing the database

1. Edit `src/db/schema.ts`.
2. `npm run db:generate -- --name short_description`
3. `npm run db:migrate`
4. Commit the schema change **and** the new file in `drizzle/`.

## Rules for this codebase

- **Money is `numeric(14, 2)`, never a float.** Drizzle returns numeric values as strings. Do money math in centavos (integers) or with a decimal library.
- **Never delete financial records.** Void payments (`voidedAt`, `voidReason`) and cancel contracts (`cancelledAt`, `cancelReason`).
- **Installment status is computed**, not stored: Paid, Partial, Due, or Past Due comes from comparing payments with due dates.
- **Record important changes in `audit_logs`** (lot status changes, voided payments, cancellations).
- **Lots only change status through the sales flow:** Available → Reserved → Sold, and a cancellation returns the lot to Available.

## Git workflow

- `main` is always deployable. Every push to `main` deploys to production (via Coolify).
- Work on a branch (`feature/lot-inventory`), open a pull request, and merge once the checks pass.
- GitHub Actions runs lint, type-check, migrations, seed, and build on every push and pull request.
