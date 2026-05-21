# Next.js + Supabase Starter Template

A production-ready starter for multi-tenant SaaS applications. Includes authentication, a full subscription billing engine, a notification system, and a rich component library — all wired up and ready to build on.

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router), React 19 |
| Database & Auth | Supabase (PostgreSQL + RLS) |
| Authentication | Supabase Auth |
| Styling | Tailwind CSS 4, shadcn/ui, Radix UI |
| Data fetching | SWR |
| Forms | React Hook Form + Zod |
| Testing | Vitest, Playwright BDD, Storybook |
| Deployment | Vercel |

## Features

**Multi-tenant billing engine** — Organizations own subscriptions. Plans are versioned so historical invoices reference immutable pricing. All plan changes flow through a `subscription_change_requests` state machine; invoices are never mutated (credit notes adjust them). Entitlements are computed and cached — never branch on plan names in application code. Supports Stripe, Paddle, and manual billing.

**Notification system** — Immutable event log fans out to recipients across in-app, email, push, SMS, Slack, and webhook channels. Per-user preferences control opt-in and delivery frequency (immediate, hourly/daily/weekly digest). Inbox supports read/archive state.

**SWR data layer** — All client data access goes through `hooks/` using SWR + the Supabase browser client directly. No REST API routes for data — just typed hooks that return `{ data, isLoading, error, mutate }`.

**BDD end-to-end tests** — Feature specs in `features/*.feature` (Cucumber/Gherkin). Step implementations auto-mock Supabase via `fixtures.steps.ts`. Run `npm run test:bddgen` to regenerate wired test files after editing `.feature` specs.

## Getting started

### Prerequisites

- Node.js 22
- A Supabase project

The repo includes a [devcontainer](.devcontainer/devcontainer.json) with the Supabase CLI, Vercel CLI, GitHub CLI, and Playwright pre-installed. Open in VS Code and select **Reopen in Container** to get a ready-to-go environment.

### Environment variables

Copy `.env.local.example` to `.env.local` and fill in your values:

```bash
cp .env.local.example .env.local
```

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key |

### Database setup

Apply migrations to your Supabase project:

```bash
supabase db push
```

Regenerate TypeScript types after schema changes:

```bash
npm run supabase:typegen
```

### Install and run

```bash
npm install
npm run dev        # http://localhost:3000
```

## Project structure

```
app/               # Next.js App Router pages and layouts
components/ui/     # shadcn/ui component library
features/          # Cucumber .feature files for BDD tests
hooks/             # SWR data hooks (one file per table group)
lib/
  db/              # Typed Supabase query helpers
  supabase/        # Browser, server, and middleware clients
providers/         # React context providers (theme, etc.)
supabase/
  migrations/      # SQL migrations
types/
  database.ts      # Auto-generated Supabase types
```

## Commands

```bash
npm run dev              # Start dev server
npm test                 # Unit + Storybook tests (vitest)
npm run test:watch       # Vitest in watch mode
npm run test:e2e         # Playwright BDD end-to-end tests
npm run test:bddgen      # Regenerate BDD test files from .feature specs
npm run lint             # ESLint
npm run format           # Prettier
npm run type-check       # tsc --noEmit
npm run storybook        # Storybook dev server (port 6006)
npm run supabase:typegen # Regenerate types/database.ts
```

## Database schema

Three migrations build the schema:

**`init`** — `accounts` table linked to `auth.users`. A trigger auto-creates an account row on user sign-up.

**`subscriptions`** — Full SaaS billing engine:
- `organizations` + `organization_members` (roles: owner, admin, member, billing)
- `plans` / `plan_versions` / `plan_feature_entitlements`
- `addons` / `addon_versions` / `addon_feature_entitlements`
- `subscriptions` + `subscription_addons`
- `subscription_change_requests` (state machine for all plan changes)
- `invoices` / `invoice_line_items` / `credit_notes` / `payments`
- `subscription_entitlements` + `usage_records` + `usage_summaries`
- `billing_webhook_events` + `idempotency_keys`
- `subscription_contracts` (enterprise)

**`notifications`** — Multi-channel notification system:
- `notification_events` (immutable append-only log)
- `notification_recipients` + `notification_inbox` (in-app read state)
- `notification_deliveries` (per-channel delivery tracking)
- `notification_preferences` (per-user opt-in per type × channel)
- `notification_templates` (versioned content per type × channel × locale)
- `notification_digests` (batch delivery queue)

All tables have Row Level Security enabled.

## Architecture notes

**Auth middleware** — Session management and route protection live in `lib/supabase/middleware.ts` via `updateSession()`. Unauthenticated users are redirected to `/login`.

**Supabase clients** — Three separate clients for different contexts:
- `lib/supabase/client.ts` — browser (client components, hooks)
- `lib/supabase/server.ts` — Server Components and Server Actions
- `lib/supabase/middleware.ts` — session refresh in middleware

**Entitlements** — Call `recompute_entitlements(subscription_id)` after any subscription or addon change. Use `useEntitlements()` / `useHasFeature(featureCode)` in components — never branch on plan names or IDs.

**`data-testid` attributes** are stripped in production builds (`next.config.ts` → `reactRemoveProperties`).

## License

MIT
