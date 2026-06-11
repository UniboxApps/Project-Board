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
    page.tsx            # Home dashboard — PM grid (Stage 11)
    settings/page.tsx   # Settings page (Stage 9)
    layout.tsx          # Session check + header bar with sign-out
  api/
    auth/[...nextauth]/ # NextAuth route handler
    jobs/route.ts       # Returns CachedDashboard from Redis (Stage 10)
    refresh/route.ts    # Triggers worker pipeline (Stage 10)
    tabs/route.ts       # Lists workbook worksheets — live from Graph API
    settings/route.ts   # GET/POST selected tab config (Stage 10)
    test-graph/route.ts # Dev/test endpoint — remove before production
  login/page.tsx        # Microsoft sign-in page
  layout.tsx            # Root layout
components/ui/          # shadcn/ui components
app/components/         # App-level components (Stages 11–12)
lib/
  types.ts              # All shared TypeScript types
  graph.ts              # Microsoft Graph API calls (token + worksheet data)
  excel.ts              # Row parsers: parsePMMap, parseDataTab
  grouping.ts           # Job grouping and sorting logic (Stage 6)
  cache.ts              # Redis read/write helpers (Stage 7)
  worker.ts             # Full pipeline (Stage 8)
  formatting.ts         # Row status: overdue / due-soon / normal (Stage 11)
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
| 6 | Job grouping logic | Next |
| 7 | Redis cache layer (Upstash) | Pending |
| 8 | Background worker — full pipeline + cron schedule | Pending |
| 9 | Settings page — tab selector + PM list viewer | Pending |
| 10 | API routes — /api/jobs, /api/refresh, /api/settings | Pending |
| 11 | Home dashboard — PM grid, tables, row formatting | Pending |
| 12 | Job detail card — modal overlay with product lines | Pending |
| 13 | Polish — skeletons, last synced, error boundaries, mobile | Pending |

---

## Key Decisions & Notes

- **Route protection:** `proxy.ts` (Next.js 16's replacement for `middleware.ts`) redirects unauthenticated requests to `/login`. The `(protected)` layout adds a server-side session check as a belt-and-braces fallback.
- **Auth lock:** OIDC discovery is scoped to `https://login.microsoftonline.com/{TENANT_ID}/v2.0` so only Unibox org accounts can authenticate. A `signIn` callback also verifies the `@unibox.co.uk` email domain.
- **Graph API auth:** App-only client credentials (not delegated). This means the background worker can run without a user session. Requires `Files.Read.All` and `Sites.Read.All` to be admin-consented.
- **Excel dates:** Graph API returns date cells as Excel serial numbers. `parseDataTab` converts them to ISO `YYYY-MM-DD` strings using `(serial - 25569) * 86400000`.
- **Column map:** All Excel column indices live in `config/columns.ts`. If the spreadsheet layout ever changes, only that file needs updating.
- **List tab:** Always read on every worker run. Never shown as toggleable in Settings. Single source of truth for which PMs are tracked.
