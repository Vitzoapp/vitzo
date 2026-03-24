# Vitzo

Vitzo is a Next.js + Supabase grocery delivery platform built around neighborhood batch delivery, referral rewards, wallet payments, live order tracking, and admin / agent operations.

This README is written for new developers joining the project. If this is your first day in the repo, start with the `Quick Start` section and come back to the rest as needed.

## What This Project Does

Vitzo supports:

- customer storefront with categories, product browsing, cart, checkout, and profile management
- batched grocery delivery windows
- referral links and Vitzo Wallet rewards
- delivery-agent registration and order handling
- admin tools for products, categories, orders, profit tracking, and admin invites

## Tech Stack

- Next.js 15
- React 19
- TypeScript
- Tailwind CSS 4
- Supabase
  - Postgres
  - Auth
  - Row Level Security (RLS)
  - SQL functions / RPCs
  - Realtime
- Lucide React

## Project Structure

Key folders:

- [src/app](C:/Users/ifuha/Documents/Vitzo/src/app): Next.js App Router pages and routes
- [src/components](C:/Users/ifuha/Documents/Vitzo/src/components): reusable UI components
- [src/context](C:/Users/ifuha/Documents/Vitzo/src/context): client-side state like cart and search
- [src/lib](C:/Users/ifuha/Documents/Vitzo/src/lib): Supabase client, types, utilities
- [supabase/schema.sql](C:/Users/ifuha/Documents/Vitzo/supabase/schema.sql): clean base schema for fresh setup
- [supabase/migrations](C:/Users/ifuha/Documents/Vitzo/supabase/migrations): incremental database changes
- [supabase/seed.sql](C:/Users/ifuha/Documents/Vitzo/supabase/seed.sql): starter product/category seed data

Important app routes:

- [src/app/page.tsx](C:/Users/ifuha/Documents/Vitzo/src/app/page.tsx): homepage
- [src/app/products/page.tsx](C:/Users/ifuha/Documents/Vitzo/src/app/products/page.tsx): product listing
- [src/app/products/[id]/page.tsx](C:/Users/ifuha/Documents/Vitzo/src/app/products/[id]/page.tsx): product detail
- [src/app/cart/page.tsx](C:/Users/ifuha/Documents/Vitzo/src/app/cart/page.tsx): cart and checkout
- [src/app/profile/page.tsx](C:/Users/ifuha/Documents/Vitzo/src/app/profile/page.tsx): profile, wallet, referrals
- [src/app/orders/page.tsx](C:/Users/ifuha/Documents/Vitzo/src/app/orders/page.tsx): customer orders
- [src/app/admin/page.tsx](C:/Users/ifuha/Documents/Vitzo/src/app/admin/page.tsx): admin panel
- [src/app/agent/dashboard/page.tsx](C:/Users/ifuha/Documents/Vitzo/src/app/agent/dashboard/page.tsx): agent dashboard

## Quick Start

### 1. Prerequisites

Install:

- Node.js 18 or newer
- npm
- a Supabase project

### 2. Install dependencies

```bash
npm install
```

### 3. Create environment variables

Create a `.env.local` file in the project root with:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

The frontend Supabase client reads these in [supabase.ts](C:/Users/ifuha/Documents/Vitzo/src/lib/supabase.ts).

### 4. Set up the database

For a brand new Supabase project:

1. Run [schema.sql](C:/Users/ifuha/Documents/Vitzo/supabase/schema.sql)
2. Run the migration files in [supabase/migrations](C:/Users/ifuha/Documents/Vitzo/supabase/migrations) in date/name order
3. Run [seed.sql](C:/Users/ifuha/Documents/Vitzo/supabase/seed.sql) if you want starter categories and products

For an existing Supabase project:

- do not rerun the full `schema.sql`
- apply only the new migration files you have not already run

### 5. Start the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Database Setup Notes

### Base schema vs migrations

Use them differently:

- [schema.sql](C:/Users/ifuha/Documents/Vitzo/supabase/schema.sql): clean setup for a fresh database
- [migrations](C:/Users/ifuha/Documents/Vitzo/supabase/migrations): safe updates for databases that already have data

### Current seed file

The seed file includes:

- categories
- 30+ realistic grocery / household / stationery products
- strict unit classifications using `unit_type` and `allowed_units`

### Recent database features in this repo

The current database layer includes support for:

- referral system
- Vitzo Wallet
- delivery batch logic
- admin invites
- pricing with `real_price`, `commission`, and generated `final_price`
- delivered-only profit tracking
- unit classifications for products using:
  - `weight`
  - `volume`
  - `discrete`

## Running and Verifying Changes

Useful commands:

```bash
npm run dev
npm run build
npx eslint src --ext .ts,.tsx
```

Recommended before opening a PR or pushing important changes:

1. run `npx eslint src --ext .ts,.tsx`
2. run `npm run build`
3. test the affected flow in the browser

## How Data Flows in the App

### Frontend

- App Router pages live in `src/app`
- shared UI lives in `src/components`
- cart state lives in [CartContext.tsx](C:/Users/ifuha/Documents/Vitzo/src/context/CartContext.tsx)
- search state lives in [SearchContext.tsx](C:/Users/ifuha/Documents/Vitzo/src/context/SearchContext.tsx)

### Backend

Most business logic is enforced in Supabase using:

- RLS policies
- Postgres functions
- triggers

Examples:

- checkout validation and wallet handling happen in `process_checkout(...)`
- referral rewards are issued server-side
- delivery cancellation checks are enforced in SQL using IST-aware rules
- profit metrics come from database-side calculation

This means:

- do not trust client input for money or permission checks
- if you change a feature, check both frontend code and SQL logic

## First Day Guide for New Developers

If you are new to the project, follow this order:

1. Read this README fully once
2. Open [package.json](C:/Users/ifuha/Documents/Vitzo/package.json) to see available scripts
3. Open [layout.tsx](C:/Users/ifuha/Documents/Vitzo/src/app/layout.tsx) to understand app-wide providers and metadata
4. Open [page.tsx](C:/Users/ifuha/Documents/Vitzo/src/app/page.tsx) to understand the storefront entry point
5. Open [admin/page.tsx](C:/Users/ifuha/Documents/Vitzo/src/app/admin/page.tsx) to understand internal operations
6. Open [database.types.ts](C:/Users/ifuha/Documents/Vitzo/src/lib/database.types.ts) to understand the current database contract
7. Scan the latest SQL files in [supabase/migrations](C:/Users/ifuha/Documents/Vitzo/supabase/migrations)

If something feels broken:

- check whether the matching SQL migration has been run in Supabase
- check whether the frontend type file matches the schema
- check the browser console and the Supabase SQL function involved

## Coding Guidelines

### Type safety

- prefer strict types
- avoid `any`
- update [database.types.ts](C:/Users/ifuha/Documents/Vitzo/src/lib/database.types.ts) when schema changes

### Database changes

When changing database behavior:

1. write a migration in [supabase/migrations](C:/Users/ifuha/Documents/Vitzo/supabase/migrations)
2. keep changes non-destructive when possible
3. update types in [database.types.ts](C:/Users/ifuha/Documents/Vitzo/src/lib/database.types.ts)
4. make sure RLS still protects user data correctly

### Frontend changes

This project prefers:

- strong branded UI
- responsive layouts
- minimal clutter
- clear inline error states instead of silent failures

### Error handling

- surface real failures to the UI
- avoid broad `try/catch` blocks that hide the cause
- keep payment, auth, and checkout errors explicit

## Common Workflows

### Add a new page

1. create the route under `src/app`
2. add or reuse components from `src/components`
3. verify navbar / footer / layout spacing works with the fixed header
4. run build and lint

### Add a new database feature

1. create a new migration SQL file
2. update the frontend types
3. update the client UI
4. verify the matching RPC or query path
5. document any required manual SQL step if the project is already live

### Seed local / fresh data

Run:

1. [schema.sql](C:/Users/ifuha/Documents/Vitzo/supabase/schema.sql)
2. migration files if needed
3. [seed.sql](C:/Users/ifuha/Documents/Vitzo/supabase/seed.sql)

## Environment and Auth Notes

- customer auth is handled through Supabase Auth
- some flows preserve referral or admin-invite state through login redirects
- admin access is controlled by the `role` field in `profiles`

If admin pages do not open as expected:

- confirm the user exists in `auth.users`
- confirm the matching row exists in `profiles`
- confirm `profiles.role = 'admin'`

## Troubleshooting

### The app builds but data looks wrong

Usually one of these:

- the latest migration was not applied in Supabase
- the database types are stale
- seeded data does not match the UI expectation

### A SQL migration fails

Check:

- whether the column already exists
- whether the project is older/newer than the migration assumed
- whether a function or constraint name already exists

### Admin features fail

Check:

- RLS policies
- `is_admin()` behavior
- `profiles.role`
- whether the relevant RPC exists in Supabase

## Files New Developers Should Know

- [README.md](C:/Users/ifuha/Documents/Vitzo/README.md)
- [package.json](C:/Users/ifuha/Documents/Vitzo/package.json)
- [schema.sql](C:/Users/ifuha/Documents/Vitzo/supabase/schema.sql)
- [seed.sql](C:/Users/ifuha/Documents/Vitzo/supabase/seed.sql)
- [database.types.ts](C:/Users/ifuha/Documents/Vitzo/src/lib/database.types.ts)
- [supabase.ts](C:/Users/ifuha/Documents/Vitzo/src/lib/supabase.ts)
- [layout.tsx](C:/Users/ifuha/Documents/Vitzo/src/app/layout.tsx)
- [globals.css](C:/Users/ifuha/Documents/Vitzo/src/app/globals.css)

## Final Notes

Vitzo is a full-stack app, not just a Next.js frontend. A lot of business rules live in the database on purpose. When you work on features here, think in three layers:

1. UI
2. Type contract
3. SQL behavior

If all three stay aligned, the project stays healthy.
