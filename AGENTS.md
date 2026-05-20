<!-- BEGIN:nextjs-agent-rules -->
 
# Next.js: ALWAYS read docs before coding
 
Before any Next.js work, find and read the relevant doc in `node_modules/next/dist/docs/`. Your training data is outdated — the docs are the source of truth.
 
<!-- END:nextjs-agent-rules -->

# Next.js Agent Rules

- [Use next/navigation router for all navigation](feedback_navigation.md) — Always use useRouter/router.push, never nav.go()


# Commands

```bash
npm run dev          # Start dev server (localhost:3000)
npm test             # Run unit + Storybook tests (vitest)
npm run test:watch   # Vitest in watch mode
npm run test:e2e     # Playwright BDD end-to-end tests
npm run lint         # ESLint
npm run format       # Prettier (write)
npm run type-check   # tsc --noEmit
npm run test:bddgen  # Regenerate BDD test files from .feature specs
npm run supabase:typegen  # Regenerate types/database.ts from Supabase schema
```

Run a single vitest test file:
```bash
npx vitest run hooks/use-events.steps.ts
```

Run a single Playwright feature:
```bash
npx playwright test --grep "Authentication"
```

# Architecture

Auth protection lives in `lib/supabase/middleware.ts` via `updateSession()` — uses `supabase.auth.getClaims()` to check session and redirect unauthenticated users to `/login`.

## Data layer

All client data fetching uses **SWR** hooks in `hooks/`. The pattern is:
1. Get the Supabase browser client via `useApiClient()` (from `hooks/use-api-client.ts`)
2. Pass it to SWR with a stable cache key string (e.g., `/api/events`)
3. Query Supabase directly from the SWR fetcher

Key hooks exported from `hooks/index.ts`: `useApiClient`, `useEvents`, `useEvent`, `useAccount`, `useActiveSubscription`, `useHasFeature`, `usePlanMeta`, `useRequestSubscriptionChange`.

Supabase clients:
- **Browser**: `lib/supabase/client.ts` — `createBrowserClient` via `@supabase/ssr`
- **Server**: `lib/supabase/server.ts` — for Server Components / Actions
- **Middleware**: `lib/supabase/middleware.ts` — session refresh + route protection

Generated DB types live in `types/database.ts` (regenerate with `npm run supabase:typegen`).

## Subscriptions & feature flags

`useActiveSubscription()` — fetches the user's active/trialing subscription row.  
`useHasFeature(featureCode)` — queries the `account_entitlements` view to check per-feature access.  
`usePlanMeta()` / `usePlanVersionIds()` — fetch plan metadata for upgrade flows.

## Testing

**Unit/component**: Vitest + Testing Library. Test files co-locate as `*.steps.ts` next to the hook or component they cover.

**BDD/E2E**: `playwright-bdd`. Feature specs live in `features/*.feature`. Step implementations are spread across `features/steps/index.steps.ts`, `fixtures.steps.ts`, `supabase/supabase.steps.ts`, and co-located `*.steps.ts` files. Running `npm run test:bddgen` regenerates the wired test files (`.feature.spec.js`).

BDD fixtures (`fixtures.steps.ts`) auto-mock Supabase via `ensureSupabaseSpy` so E2E tests intercept network calls.

`data-testid` attributes are stripped in production builds (`next.config.ts` → `reactRemoveProperties`).

## Styling

Tailwind CSS 4 + shadcn/ui (components in `components/ui/`). Custom CSS vars use the `--app-*` prefix. Multiple Google Fonts are loaded via `next/font` in the root layout.

# Next.js App Router Navigation

- Apply these rules when the matched file is a client component or contains client-side navigation behavior.
- In App Router code, import routing hooks from `next/navigation`, never `next/router`.
- In client components, use `Link` from `next/link` for rendered navigation elements such as tabs, cards, menus, inline links, and lists of destinations.
- Use `useRouter()` only for imperative navigation triggered by user actions or client-side side effects, such as submit success, close flows, or button-only navigation.
- Use `router.push()` when the destination should create a new history entry.
- Use `router.replace()` when the current screen should not remain in history, such as auth completion, upgrade funnels, or transient success states.
- Use `router.back()` and `router.forward()` only for real history navigation, not as substitutes for known app routes.
- Use `router.refresh()` when you need fresh server-rendered data for the current route after a mutation.
- Never use `nav.go()`, `window.location`, `location.href`, or `history.pushState()` for internal app navigation.
- Never pass untrusted or unsanitized URLs into `router.push()` or `router.replace()`.
- Use `usePathname()`, `useSearchParams()`, and `useParams()` for route state instead of expecting pathname or query data from `useRouter()`.
- Do not call `redirect()` inside client event handlers. If navigation happens from a click, submit callback, or other client event, use `router.push()` or `router.replace()`.
- If a redirect is needed during render, prefer a server page, layout, or proxy boundary. If a client component must redirect, keep it in render logic only, not inside handlers.
- Prefer absolute app routes that mirror the folder structure, for example `/app/events/${eventId}`.

## Preferred Patterns

```tsx
'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

export function EventActions({ eventId }: { eventId: string }) {
  const pathname = usePathname()
  const router = useRouter()

  return (
    <>
      <Link href={`/app/events/${eventId}`}>Open event</Link>
      <button type="button" onClick={() => router.replace('/app/hub')}>
        Done
      </button>
      <span aria-current={pathname === '/app/hub' ? 'page' : undefined}>Hub</span>
    </>
  )
}
```

## Avoid

```tsx
'use client'

import { redirect } from 'next/navigation'

export function BadButton() {
  return (
    <button type="button" onClick={() => redirect('/app/hub')}>
      Go
    </button>
  )
}
```

# BDD Feature Files and Step Definitions

## Feature files (`features/*.feature`)

- Each feature file covers one screen or user-facing capability.
- Start every feature with a `Feature:` title, a three-line As/I want/So that preamble, and a `Background:` block that seeds the minimum required state (device, auth, account row, any fixture data).
- Group scenarios under comment banners (`# ── Section ───`) to separate logical areas within a feature.
- Write one `Scenario:` per observable behaviour. Keep step counts low — if a scenario needs more than ~5 steps, look for a missing shared step or a fixture gap.
- Comment out scenarios that are not yet implemented rather than deleting them, so intent is preserved.
- Step text must exactly match a registered step pattern (string literal or Cucumber expression). Never invent new step wording when an existing step covers the same action.

### Example — navigation scenario

```gherkin
Scenario: Notifications is reachable from the Hub bell icon
  Given I go to page "app home"
  When I click notifications on hub
  Then I see the page "notifications"
```

### Example — layout / visibility scenario

```gherkin
Scenario: Upload page shows take a photo option
  Given I go to page "upload" for event "123"
  Then I see the take a photo button
```

### Example — interaction scenario

```gherkin
Scenario: Adding a comment updates the list
  When I go to the comments screen for photo "1"
  And I type "Amazing shot!" in the comment input
  And I submit the comment
  Then I see comment 0
```

### Example — supabase mocking scenario

```gherkin
Background:
  Given I am using a mobile device
  And a user exists with email "bdd@example.com" and password "Password123@"
  And I am signed in as "bdd@example.com" with password "Password123@"
  And My account information is: # seeds the account row for `useAccount()`
    | auth_id    | bbc00b1f-eb53-4ffc-a26b-27cb34d8ead5 |
    | code       | 5678-5678-231423-23423               |
    | name       | Seed                                 |
    | created_at | 2024-01-01T00:00:00Z                 |
    | id         | 1                                    |
  And An event exists with data: # seeds the event row for `useEvent()` and `useEvents()`
    | id      | 123                                |
    | code    | 1322-3214-231423-23423             |
    | hero    | https://example.com/event-hero.jpg |
    | privacy | public                             |
    | access  | full                               |
  And An event title exists with data: # seeds the event_title row for `useEventTitle()`
    | id         | 1                    |
    | event_id   | 123                  |
    | title      | MAYA 2024            |
    | created_at | 2024-01-01T00:00:00Z |
  And An event date exists with data: # seeds the event_date row for `useEventDate()`
    | id         | 1                    |
    | event_id   | 123                  |
    | date       | 2024-12-31T23:59:59Z |
    | created_at | 2024-01-01T00:00:00Z |
  And An event hero exists with data: # seeds the event_hero row for `useEventHero()`
    | id         | 1                                  |
    | event_id   | 123                                |
    | url        | https://example.com/event-hero.jpg |
    | created_at | 2024-01-01T00:00:00Z               |
  And A photo exists with data: # seeds the photo row for `usePhotos()` and `usePhoto()`
    | id       | 1                              |
    | event_id | 123                            |
    | url      | https://example.com/photo1.jpg |

# ── Hero ─────────────────────────────────────────────────────────

Scenario: Successfully view event details
  Given I go to page event "123"
  Then I see the event title "MAYA 2024"
  And I see the event date "Dec 31, 2024"
  And I see the event hero "https://example.com/event-hero.jpg"
  And I see the photo "1" with url "https://example.com/photo1.jpg"
```

## Step files (`*.steps.ts`)

- **Location rule**: steps that belong to a single screen live in a co-located file next to the screen component (`components/screens/screen-*.steps.ts`). Steps shared across multiple features go in `features/steps/index.steps.ts`.
- Playwright BDD discovers all `**/*.steps.ts` files automatically (see `playwright.config.ts`) — no manual registration needed.
- Always import `Given`, `When`, `Then`, `Before` from `@/fixtures.steps` (not directly from `playwright-bdd`). This ensures the custom Supabase fixture is available in every step.
- Steps interact with the UI exclusively via `data-testid` selectors (`page.getByTestId(...)`). Never use CSS selectors, text content, or ARIA role queries in step implementations.
- Use `expect` from `playwright/test`, not from vitest or any other assertion library.
- Keep each step implementation to a single, focused action or assertion. Extract multi-step sequences into helpers only if they are reused across three or more steps.
- Step parameters use Cucumber expressions (`{string}`, `{int}`) — never raw regex unless unavoidable.

### Example — co-located screen step file

```ts
// components/screens/screen-hub.steps.ts
import { Then, When } from '@/fixtures.steps';
import { expect } from 'playwright/test';

When('I click hub event {string}', async ({ page }, id: string) => {
  await page.getByTestId(`hub-event-${id}`).click();
});

Then('I see hub event {string}', async ({ page }, id: string) => {
  await expect(page.getByTestId(`hub-event-${id}`)).toBeVisible();
});

Then('I see the empty hub events state', async ({ page }) => {
  await expect(page.getByTestId('hub-no-events')).toBeVisible();
});
```

## `fixtures.steps.ts` (root)

- The root `fixtures.steps.ts` extends the base Playwright `test` with a `supabaseMock` fixture and exports `Given`, `When`, `Then`, `Before` via `createBdd`.
- All step files must import from this file so they share the same fixture-extended `test` instance. Importing directly from `playwright-bdd` bypasses the Supabase mock.

# Data Access Through Hooks

All database table access goes through `hooks/` files using SWR + the Supabase browser client directly (not fetch API routes). One file per logical table group.

- `'use client'` at top
- `createClient()` from `@/lib/supabase/client` called inside each SWR fetcher
- `useSWRConfig().mutate` used to invalidate related cache keys after mutations
- `useSWRMutation` for create/update/delete, bound to a `${KEY}/action` key
- Cache keys use `/api/table-name` prefix with query params for filtering
- After any mutation, call `mutate(listKey)` and optionally `mutate(itemKey)` to keep the UI cache in sync.
- Default to keeping app data access in custom hooks under `hooks/`.
- Prefer pages and components that consume hooks instead of defining fetch logic inline.
- Prefer hooks that return `{ data, isLoading, error, mutate }` (or a named data alias plus those fields).
- If Supabase data is not ready, prefer mock data in the same hook file instead of pages/components.
- Prefer `lib/supabase/client.ts` for client-side Supabase access inside hooks.
- For server components that need initial load, use `lib/supabase/server.ts` and pass data down; interactive updates should still live in hooks.
- After mutations, call `mutate()` so UI cache stays in sync.
- Exceptions are acceptable when a task explicitly requires a different approach; add a brief comment explaining why.

## Pattern

```tsx
'use client';

import useSWR from 'swr';
import { createClient } from '@/lib/supabase/client';
import type { Thing } from '@/types';

const mockThings: Thing[] = [{ id: '1', name: 'Example thing' }];

export function useThings() {
  const { data, error, isLoading, mutate } = useSWR<Thing[]>(
    '/api/things',
    async () => {
      // Replace with Supabase query when available.
      // const client = createClient();
      // const { data, error } = await client.from('things').select('*');
      // if (error) throw error;
      // return data as Thing[];
      return mockThings;
    },
    { revalidateOnFocus: false }
  );

  return { data, isLoading, error, mutate };
}
```