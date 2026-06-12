# Unibox Project Board

A Next.js web app that reads a SharePoint-hosted Excel file via the Microsoft Graph API and displays a live project board grouped by project manager. Authentication is restricted to Unibox Microsoft 365 accounts.

Full specification: see `PLAN.md` in the project root (one level above this folder).

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router) |
| Auth | NextAuth.js v5 beta — Microsoft Entra ID (Azure AD) |
| Data source | SharePoint Excel via Microsoft Graph API (app-only client credentials) |
| Styling | Tailwind CSS v4 + shadcn/ui (zinc theme) |
| Cache | Redis via Upstash (free tier) |
| Testing | Vitest |
| Package manager | npm |

---

## Getting Started

### Prerequisites

- Node.js 18+
- An Azure AD app registration (see `PLAN.md` Part 1 for required permissions)
- An Upstash Redis account (free tier is sufficient)

### Environment Variables

Copy `.env.local.example` to `.env.local` and fill in all values:

```
AZURE_AD_CLIENT_ID=
AZURE_AD_CLIENT_SECRET=
AZURE_AD_TENANT_ID=
AUTH_SECRET=          # generate with: npx auth secret
NEXTAUTH_URL=http://localhost:3000
SHAREPOINT_FILE_PATH= # /sites/{site-id}/drives/{drive-id}/items/{file-id}
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
CRON_SECRET=          # generate with: openssl rand -hex 32
```

### Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000 — you will be redirected to the Microsoft sign-in page.

### Run tests

```bash
npm test          # run once
npm run test:watch  # watch mode
```

---

## Project Structure

```
app/
  (protected)/          # Auth-gated routes (route group — no URL segment)
    page.tsx            # Home dashboard — PM grid
    loading.tsx         # Skeleton shown while dashboard loads on navigation
    error.tsx           # Error boundary — friendly panel + retry button
    settings/page.tsx   # Settings page
    layout.tsx          # Responsive header (two-row mobile / single-row desktop); mounts AutoRefresh
  api/
    auth/[...nextauth]/ # NextAuth route handler
    jobs/route.ts       # Returns CachedDashboard from Redis
    refresh/route.ts    # Triggers worker pipeline
    tabs/route.ts       # Lists workbook worksheets — live from Graph API
    settings/route.ts   # GET/POST selected tab config
    cron/route.ts       # Vercel Cron endpoint — runs worker every 10 min
    test-graph/route.ts # Dev/test endpoint — remove before production
  login/page.tsx        # Microsoft sign-in page
  layout.tsx            # Root layout
  components/
    AutoRefresh.tsx     # Invisible client component — silent 9-min router.refresh() interval
    HeaderTimestamp.tsx # Async server component — fetches lastRefreshed, renders RefreshButton
    StatusBadge.tsx     # Single pill badge (Install / Overdue / Due Soon)
    StatusBadges.tsx    # Badge trio used by JobDetailCard
    JobRow.tsx          # Clickable row — Install/Overdue badges by job no; yellow Install highlight
    JobDetailCard.tsx   # Modal overlay — max-h-[90vh], fixed header/columns/footer, scrollable rows
    PMBoard.tsx         # PM card — single-line header: name (initials) left, count + total right
    RefreshButton.tsx   # Last synced + Refresh button — fully prop-driven, no local timestamp state
    TabSelector.tsx     # Settings — Save → refresh → redirect to dashboard
    PMList.tsx          # Settings — read-only PM list
components/ui/          # shadcn/ui components
lib/
  types.ts              # All shared TypeScript types
  graph.ts              # Microsoft Graph API calls (token + worksheet data)
  excel.ts              # Row parsers: parsePMMap, parseDataTab
  grouping.ts           # Job grouping and sorting logic
  cache.ts              # Redis read/write helpers
  worker.ts             # Full pipeline
  formatting.ts         # Shared formatters: getRowStatus, formatGBP (0 dp), formatDate, formatLastRefreshed
  api.ts                # jsonRoute() — shared error-handling wrapper for API routes
config/
  columns.ts            # COLUMN_MAP — single source of truth for Excel layout
  constants.ts          # REDIS_KEYS, ALWAYS_READ_TABS, CACHE_REFRESH_MINUTES
```

---

## Build Progress

| Stage | Task | Status |
|---|---|---|
| 1 | Scaffold Next.js 16, TypeScript, Tailwind, shadcn/ui | Done |
| 2 | NextAuth v5 + Azure AD, tenant-locked, @unibox.co.uk check | Done |
| 3 | Microsoft Graph API — token, list worksheets, fetch sheet data | Done |
| 4 | List tab parser — reads List tab, builds PMMap | Done |
| 5 | Data tab parser — column mapping, row filtering, ParsedRow objects | Done |
| 6 | Job grouping logic | Done |
| 7 | Redis cache layer (Upstash) | Done |
| 8 | Background worker — full pipeline + cron schedule | Done |
| 9 | Settings page — tab selector + PM list viewer | Done |
| 10 | API routes — /api/jobs, /api/refresh, /api/settings | Done |
| 11 | Home dashboard — PM grid, tables, row formatting | Done |
| 12 | Job detail card — modal overlay with product lines | Done |
| — | Refactor + code-simplifier pass | Done |
| — | Design pass — font, header layout, PM card, row styling, Settings save flow | Done |
| 13 | Polish — skeletons, error boundary, auto-refresh, mobile header | Done |
| — | Vercel deployment + GitHub integration | Done |
| — | Job detail card scroll fix | Done |

---

## Key Decisions & Notes

- **Route protection:** `proxy.ts` (Next.js 16's replacement for `middleware.ts`) redirects unauthenticated requests to `/login`. The `(protected)` layout adds a server-side session check as a belt-and-braces fallback.
- **Auth lock:** OIDC discovery is scoped to `https://login.microsoftonline.com/{TENANT_ID}/v2.0` so only Unibox org accounts can authenticate. A `signIn` callback also verifies the `@unibox.co.uk` email domain.
- **Graph API auth:** App-only client credentials (not delegated). This means the background worker can run without a user session. Requires `Files.Read.All` and `Sites.Read.All` to be admin-consented.
- **Excel dates:** Graph API returns date cells as Excel serial numbers. `parseDataTab` converts them to ISO `YYYY-MM-DD` strings using `(serial - 25569) * 86400000`.
- **Column map:** All Excel column indices live in `config/columns.ts`. If the spreadsheet layout ever changes, only that file needs updating.
- **List tab:** Always read on every worker run. Never shown as toggleable in Settings. Single source of truth for which PMs are tracked.
- **Font:** Inter (Google Fonts) loaded via `next/font/google`, variable set to `--font-sans`. Replaces the default Geist scaffold font.
- **Header layout:** Single bar on desktop — brand left, Settings nav centre, Last synced + Refresh + user + sign-out right. On mobile (`< md`), collapses to two rows: brand + sign-out on top, Refresh + Settings on the second row.
- **Header timestamp:** Fetched by `HeaderTimestamp` (async server component) wrapped in `<Suspense>` so it resolves independently without blocking the rest of the header.
- **Auto-refresh:** `AutoRefresh` client component mounts a 9-minute `setInterval` that calls `router.refresh()` silently. Users always see current data without manual intervention. The manual Refresh button forces an immediate SharePoint → Redis rebuild.
- **Loading skeleton:** `(protected)/loading.tsx` shows two pulsing PM card placeholders on navigation. Not shown on background `router.refresh()` calls.
- **Error boundary:** `(protected)/error.tsx` catches errors from `getDashboardOrRefresh()` and shows a friendly panel with a retry button.
- **Job detail card:** Capped at `max-h-[90vh]` so it never overflows the screen. Job header, column headers, and group total footer are fixed. Only the product lines tbody scrolls.
- **PM card header:** One line — `Name (Initials)` left-aligned, project count + total value right-aligned.
- **Currency formatting:** `formatGBP` uses 0 decimal places throughout (e.g. £5,352 not £5,351.81).
- **Row styling:** Install badge and Overdue badge sit inline with the job number. Install rows have a yellow (`bg-yellow-50`) background. Overdue rows remain red; due-soon rows amber. Row padding reduced to `py-1.5` for a more compact table.
- **Settings save flow:** Clicking Save in TabSelector POSTs to `/api/settings`, then immediately POSTs to `/api/refresh`, then redirects to `/`. Button label tracks each stage (Saving… → Refreshing… → redirect). No separate Refresh Now button needed.
