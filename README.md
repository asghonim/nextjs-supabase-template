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

**Role-based access control (RBAC)** — Three independent permission layers: Platform (global admin), Organization, and Project. Each layer has its own roles table with a role→permission junction, so permissions are never hardcoded. One user can be a Platform Admin globally, a Viewer in Org A, and an Owner in Org B. Always check access via the SQL helpers (`has_org_permission()`, `has_project_permission()`, `has_platform_permission()`) or the corresponding SWR hooks — never branch on role names. Backward-compatible with the existing `org_member_role` enum via an auto-sync trigger.

**API keys** — Scoped programmatic access via `sk_live_*` keys. Only the SHA-256 hash is stored; the plaintext is shown once at creation. Keys carry a `scopes` array drawn from the seeded `api_scopes` table (`read`, `write`, `qr:read`, etc.). Use `authenticateApiKey(request, requiredScope?)` in any `app/api/v1/` route to verify a key. Creating or revoking keys requires the `apikey.create` project permission.

**Service accounts** — Non-human Supabase Auth users that can own API keys for observability. Email and password are server-generated and unguessable — nobody can sign in as a service account. Each service account has a real `accounts` row so it appears in audit trails alongside human users.

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

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Yes | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service role key — used server-side only, never exposed to the browser |
| `SUPABASE_JWT_SECRET` | Yes | JWT secret from your Supabase project (Settings → API) — used to mint short-lived tokens for API key authentication |
| `RESEND_API_KEY` | No | [Resend](https://resend.com) API key — contact form email notifications are skipped when absent |
| `RESEND_FROM_EMAIL` | No | From address for outgoing email, e.g. `Support <support@example.com>` |
| `CONTACT_NOTIFICATION_EMAIL` | No | Address that receives admin notifications for new contact submissions |
| `CLOUDFLARE_TURNSTILE_SECRET_KEY` | No | Cloudflare Turnstile secret — CAPTCHA verification is skipped when absent |
| `NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY` | No | Cloudflare Turnstile site key — the CAPTCHA widget is hidden when absent |

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

**`rbac`** — Role-based access control:
- `platform_roles` / `platform_role_permissions` / `account_platform_roles`
- `organization_roles` / `organization_role_permissions` (replaces hardcoded `org_member_role` enum logic)
- `project_roles` / `project_role_permissions` / `project_members`
- Backward-compat trigger `sync_org_member_role_id` keeps `organization_members.role` in sync

**`api_keys`** — Programmatic API access:
- `api_scopes` — seeded list of valid scopes
- `api_keys` — prefix + SHA-256 hash (plaintext never stored), scopes array, expiry
- `verify_api_key(p_key_hash)` RPC — SECURITY DEFINER, callable by service role only

**`contact`** — Contact form ticketing system:
- `contact_submissions` — source of truth for all submissions; status state machine, priority, spam score, IP/browser metadata
- `contact_messages` — message thread per submission; initial customer message is mirrored here on creation
- `contact_attachments` — file attachment metadata (files live in object storage)
- `outbox_events` — transactional outbox; written atomically with each submission so email notifications can be retried if they fail

Default email templates are seeded into `notification_templates` under types `contact_submission.admin_notification` and `contact_submission.auto_response`. Edit those rows to customise content without a code deploy.

All tables have Row Level Security enabled.

## Architecture notes

**Auth middleware** — Session management and route protection live in `lib/supabase/middleware.ts` via `updateSession()`. Unauthenticated users are redirected to `/login`.

**Supabase clients** — Four separate clients for different contexts:
- `lib/supabase/client.ts` — browser (client components, hooks)
- `lib/supabase/server.ts` — Server Components and Server Actions
- `lib/supabase/middleware.ts` — session refresh in middleware
- `lib/supabase/admin.ts` — service role client for API routes that need to bypass RLS (contact form, outbox processor)

**Entitlements** — Call `recompute_entitlements(subscription_id)` after any subscription or addon change. Use `useEntitlements()` / `useHasFeature(featureCode)` in components — never branch on plan names or IDs.

**RBAC** — Permission checks are always done via SQL helpers or their TypeScript wrappers — never by comparing role names in application code. The three layers (Platform / Organization / Project) are fully independent; a user's role in one context has no bearing on another. Key files: `lib/rbac/permissions.ts` (constants), `lib/db/rbac.ts` (DB helpers), `hooks/use-permissions.ts` (SWR hooks).

**API keys** — `lib/api-keys.ts` exposes `generateApiKey()` (returns the plaintext `sk_live_*` key) and `hashApiKey()` (SHA-256 hex). The plaintext is never stored — hand it to the user immediately and discard it. All API routes under `app/api/v1/` should call `authenticateApiKey(request, requiredScope?)` from `app/api/v1/authenticate.ts`; when it returns a `NextResponse` the request is unauthorized and the route should return it directly. Service account creation goes through `POST /api/service-accounts` (requires a valid session + `apikey.create` permission) — never create service account auth users directly from client code.

**`data-testid` attributes** are stripped in production builds (`next.config.ts` → `reactRemoveProperties`).

## License

MIT
