# Unibox Project Board — Full Summary

## What the app does

The Unibox Project Board is an internal web application that gives the Unibox team a live view of all active projects, grouped by Project Manager. It reads data directly from a SharePoint-hosted Excel workbook via the Microsoft Graph API, processes it, and presents it as a clean dashboard.

Users see a card for each Project Manager showing their jobs in a table. Each row shows a job number, customer name, total value, and due date, colour-coded by urgency. Clicking a row opens a detail card listing every product line on that job with individual quantities and prices.

The data refreshes automatically every 10 minutes via a scheduled cron job. Users can also force an immediate refresh from the header. The app is restricted to Unibox Microsoft 365 accounts — no one outside the organisation can log in.

---

## Who it is for

Internal Unibox staff. Authentication is locked to `@unibox.co.uk` accounts only. There is no public-facing access.

---

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Auth | NextAuth v5 beta — Microsoft Entra ID (Azure AD) |
| Data source | SharePoint Excel via Microsoft Graph API (app-only client credentials) |
| Cache | Upstash Redis (HTTP REST client, free tier) |
| Styling | Tailwind CSS v4 + shadcn/ui (zinc theme) |
| Font | Inter (Google Fonts, loaded via `next/font/google`) |
| Tests | Vitest |
| Package manager | npm |
| Hosting | Vercel (auto-deploy on push to `master`) |

---

## How the data flows

### Step 1 — Excel workbook structure

The workbook lives in SharePoint. It has multiple worksheets:

- **List tab** — a two-column lookup table: PM initials in column A, full name in column B. This tab is always read on every worker run and is the single source of truth for which Project Managers are tracked.
- **Data tabs** — one or more worksheets containing the actual job rows. Each row represents one product line on a job. The columns that matter are mapped in `config/columns.ts`:

| Column | Excel column | Contains |
|---|---|---|
| jobNumber | A (0) | Job reference number |
| customerName | B (1) | Customer name |
| description | C (2) | Product line description |
| quantity | D (3) | Quantity |
| deliveryOption | N (13) | Delivery type — checked for "Install" |
| requiredByDate | O (14) | Due date (stored as Excel serial number) |
| pmInitials | V (21) | Project Manager initials |
| itemValue | Y (24) | Per-unit price |
| lineTotal | Z (25) | Line total (quantity × item value) |

### Step 2 — Graph API fetch

The app uses app-only client credentials (no delegated user auth) so the background worker can run without a logged-in user. It requests `Files.Read.All` and `Sites.Read.All` permissions, which must be admin-consented in Azure.

`lib/graph.ts` handles:
- Getting an OAuth2 token from Azure using client credentials
- A `graphGet` helper that wraps all Graph API calls with the token
- `listWorksheets` — lists all worksheets in the workbook
- `getWorksheetRange` — fetches the used range of a named worksheet as a 2D array of cell values

### Step 3 — Parsing

`lib/excel.ts` contains two parsers:

**`parsePMMap`** reads the List tab and builds a plain object mapping initials → full name, e.g. `{ PB: "Paul Bolton", JD: "Jane Doe" }`.

**`parseDataTab`** reads one data worksheet row by row and produces `ParsedRow` objects. It:
- Skips the header row (row 0)
- Discards any row with a blank job number
- Discards any row whose PM initials are not in the PM map (unknown PM = not tracked)
- Converts Excel date serial numbers to ISO strings using the formula `(serial - 25569) × 86400000`
- Falls back to direct `Date` parsing if the cell contains a pre-formatted string

### Step 4 — Grouping

`lib/grouping.ts` takes the flat list of `ParsedRow` objects and groups them into a `CachedDashboard`.

Grouping rules:
- Composite key = `jobNumber + '|' + requiredByDate` — each unique combination becomes one `JobDateGroup`
- `totalValue` = sum of all `lineTotal` values in the group
- `hasInstall` = true if any `deliveryOption` in the group contains "install" (case-insensitive)
- Groups are sorted by `requiredByDate` ascending; blank dates sort last
- `totalProjects` per PM = count of unique job numbers
- `totalValue` per PM = sum of all group totals
- PMs are sorted alphabetically by initials for stable ordering

The result is a `CachedDashboard`:
```
{
  boards: PMBoard[]       // one entry per PM
  lastRefreshed: string   // ISO timestamp of this run
  tabsProcessed: string[] // which tabs were read
}
```

### Step 5 — Redis cache

`lib/cache.ts` wraps Upstash Redis using a lazy singleton pattern (one instance per process). It stores:
- The full `CachedDashboard` object under a fixed key
- The user-selected tab names under a separate key

The cache has no TTL — it holds the last successful worker run indefinitely. The cron job updates it every 10 minutes.

### Step 6 — Worker pipeline

`lib/worker.ts` orchestrates the full pipeline:
1. Read the List tab → build PM map
2. Read selected tabs from Redis → filter out always-read tabs
3. Fetch and parse each data tab (bad tabs are logged and skipped, not fatal)
4. Group all rows into a dashboard
5. Write dashboard to Redis
6. Return the fresh dashboard

`getDashboardOrRefresh` is used by the dashboard page on cold start — if Redis is empty, it runs the worker inline rather than returning an empty page.

---

## API routes

| Route | Method | Purpose |
|---|---|---|
| `/api/auth/[...nextauth]` | GET/POST | NextAuth route handler |
| `/api/jobs` | GET | Returns `CachedDashboard` from Redis (runs worker if cache empty) |
| `/api/refresh` | POST | Runs worker immediately, returns `lastRefreshed` + `tabsProcessed` |
| `/api/settings` | GET | Returns selected tab config from Redis |
| `/api/settings` | POST | Saves selected tab config to Redis |
| `/api/tabs` | GET | Lists workbook worksheets live from Graph API |
| `/api/cron` | GET | Vercel cron endpoint — runs worker on schedule |

The cron endpoint is protected by `CRON_SECRET`. Vercel sends the secret as `Authorization: Bearer <secret>`. All other API routes use a shared `jsonRoute` wrapper in `lib/api.ts` that catches errors and returns structured 500 responses.

---

## Authentication

Authentication uses NextAuth v5 beta with the Microsoft Entra ID (Azure AD) provider.

The OIDC discovery URL is scoped to the Unibox tenant:
```
https://login.microsoftonline.com/{TENANT_ID}/v2.0
```
This means only Unibox organisation accounts can even attempt to authenticate.

A `signIn` callback provides a second layer of protection — it checks that the authenticated user's email ends with `@unibox.co.uk`. Anyone signing in with a personal Microsoft account (even if they somehow passed the tenant check) is rejected.

Route protection is handled by `proxy.ts` (Next.js 16's replacement for `middleware.ts`). It intercepts all requests except:
- `/api/auth` (NextAuth itself)
- `/api/cron` (Vercel cron runner — no user session)
- `/login`
- Next.js static assets and image routes

The `(protected)` route group layout adds a server-side `auth()` check as a belt-and-braces fallback.

---

## Auto-refresh system

There are two independent refresh mechanisms:

**Cron job (server-side, every 10 minutes)**
`vercel.json` configures a Vercel Cron Job that calls `/api/cron` every 10 minutes. This runs the full worker pipeline — fetches fresh data from SharePoint and updates the Redis cache.

**Auto-refresh (client-side, every 9 minutes)**
`AutoRefresh.tsx` is an invisible client component mounted in the layout. It runs a `setInterval` that calls `router.refresh()` every 9 minutes. In Next.js App Router, `router.refresh()` triggers a background server re-render and swaps the DOM without showing a loading skeleton. This means users always see up-to-date data from the cache without manually refreshing.

The two intervals are deliberately offset — the cron populates the cache at :00, :10, :20 etc., and the client refreshes at :09, :18 etc. — so a client refresh always reads a recently updated cache.

**Manual refresh**
The Refresh button in the header POSTs to `/api/refresh`, which runs the full worker pipeline immediately (bypassing the 10-minute schedule), then calls `router.refresh()` to update the UI.

---

## Dashboard layout and styling

### Overall layout

- White background header with a bottom border, fixed at the top
- Gray (`bg-gray-50`) page background
- Content area with `px-6 py-6` padding

### Header

**Desktop (md and above):** Single row
- Left: "Unibox" (bold) + "Project Board" (gray, lighter weight)
- Centre: Settings navigation link
- Right: Last synced timestamp + Refresh button | logged-in user's name | Sign out

**Mobile (below md):** Two rows
- Row 1: Brand name + Sign out button
- Row 2: Last synced + Refresh button on the left, Settings link on the right

The timestamp is rendered by `HeaderTimestamp`, an async server component wrapped in `<Suspense>`. It fetches `lastRefreshed` from Redis independently so it does not block the rest of the header from rendering. The fallback shows "Loading…".

The relative time text ("Data synced: 2 mins ago") is computed client-side in `RefreshButton` via a `useEffect` interval that runs every 60 seconds. This keeps the counter live between `router.refresh()` cycles rather than freezing at the time of the last server render.

### PM cards

The dashboard is a 2-column grid on extra-large screens (`xl:grid-cols-2`), 1 column below that.

Each PM card is a white rounded card (`rounded-lg border border-gray-200 shadow-sm`) containing:

**Card header** — one line:
- Left: "Full Name (Initials)" — name bold, initials in lighter gray
- Right: "N projects · £X,XXX" — project count and total portfolio value

**Table** — four columns with a gray header row:
- Job No
- Customer
- Value (right-aligned)
- Due Date

### Row colour coding

Each job row is clickable and colour-coded by urgency:

| Condition | Background |
|---|---|
| Overdue (due date in the past) | `bg-red-50`, hover `bg-red-100` |
| Due soon (due today or tomorrow) | `bg-amber-50`, hover `bg-amber-100` |
| Has Install delivery option | `bg-yellow-50`, hover `bg-yellow-100` |
| Normal | White, hover `bg-gray-50` |

### Status badges

Small pill badges appear inline next to the job number:

| Badge | Colour | When shown |
|---|---|---|
| Install | Yellow (`bg-yellow-100 text-yellow-800`) | Row has any product line with "install" in delivery option |
| Overdue | Red (`bg-red-100 text-red-700`) | Due date is in the past |
| Due Soon | Amber (`bg-amber-100 text-amber-800`) | Due today or tomorrow |

Overdue date text is also rendered in bold red (`font-semibold text-red-700`).

### Job detail card (modal)

Clicking any row opens a modal overlay:

- Semi-transparent black backdrop (`bg-black/40`) — the dashboard remains visible behind
- White card, max width `max-w-2xl`, capped at `max-h-[90vh]` so it never goes off-screen
- Click backdrop or press Escape to close
- Closing × button in the top-right corner

**Card structure (from top to bottom, all fixed except the middle section):**
1. **Header** (fixed, never scrolls) — job number, customer name, PM name, due date, status badges. Background tinted by status: `bg-red-50` if overdue, `bg-amber-50` if due soon, white otherwise.
2. **Column headers** (fixed) — Description, Qty, Item £, Total £
3. **Product lines** (scrollable) — one row per product line with description, quantity, per-unit price, line total
4. **Footer** (fixed) — "Group Total" right-aligned with the summed value

Only the product lines section scrolls, keeping the header context and total always visible regardless of how many lines the job has.

### Loading skeleton

`(protected)/loading.tsx` is shown by Next.js automatically during navigation to the dashboard. It renders two pulsing placeholder cards (`animate-pulse`) matching the 2-column PM grid layout, each with:
- A shimmer header bar
- Four skeleton rows matching the height of real job rows

This is not shown during background `router.refresh()` calls — only on hard navigation.

### Error boundary

`(protected)/error.tsx` catches any error thrown by the dashboard server component. It displays a red-tinted panel with the error digest and a "Try again" button that calls `reset()` to re-attempt the render.

---

## Settings page

The settings page (`/settings`) has two sections:

**Tab selector** — lets the user choose which Excel worksheets to include in the dashboard. The List tab is always included and is not toggleable. Clicking Save:
1. POSTs the selection to `/api/settings` (saves to Redis)
2. Immediately POSTs to `/api/refresh` (runs the worker with the new tab set)
3. Redirects to `/`

The button label updates through each stage: "Save" → "Saving…" → "Refreshing…" → redirect.

**PM list** — a read-only display of the Project Managers currently defined in the List tab, showing their initials and full names.

---

## Currency and date formatting

All currency values use `formatGBP` — British pounds with 0 decimal places, using `en-GB` locale, e.g. £5,352 not £5,351.81.

Dates are displayed in `en-GB` format, e.g. "12 Jun 2026".

The "Data synced" header timestamp shows relative time: "Just now", "1 min ago", "N mins ago". It is computed client-side and updates every 60 seconds, so it stays accurate between background screen refreshes.

---

## Environment variables

| Variable | Purpose |
|---|---|
| `AZURE_AD_CLIENT_ID` | Azure App Registration client ID |
| `AZURE_AD_CLIENT_SECRET` | Azure App Registration client secret |
| `AZURE_AD_TENANT_ID` | Unibox Azure tenant ID |
| `AUTH_SECRET` | NextAuth signing secret (generate with `npx auth secret`) |
| `NEXTAUTH_URL` | Full production URL, e.g. `https://unibox-project-board.vercel.app` |
| `SHAREPOINT_FILE_PATH` | Graph API path to the Excel file (`/sites/.../drives/.../items/...`) |
| `UPSTASH_REDIS_REST_URL` | Upstash Redis REST endpoint URL |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis REST token |
| `CRON_SECRET` | Shared secret — Vercel sends as `Authorization: Bearer` on cron calls |

---

## Deployment

The app is deployed to Vercel at `https://unibox-project-board.vercel.app`.

Every push to the `master` branch in GitHub triggers an automatic Vercel build and deployment. Typical deploy time is 1–2 minutes. The build output is a serverless Next.js deployment — each route is an individual serverless function or edge function.

The Azure App Registration must have the Vercel production URL added as a redirect URI:
```
https://unibox-project-board.vercel.app/api/auth/callback/microsoft-entra-id
```

---

## File structure (key files)

```
app/
  (protected)/
    page.tsx            # Home dashboard — PM grid
    loading.tsx         # Navigation skeleton — two pulsing PM card placeholders
    error.tsx           # Error boundary — red panel + retry button
    layout.tsx          # Responsive header; mounts AutoRefresh
    settings/page.tsx   # Settings — tab selector + PM list
  api/
    auth/[...nextauth]/ # NextAuth route handler
    jobs/route.ts       # GET CachedDashboard from Redis
    refresh/route.ts    # POST — runs worker, returns lastRefreshed
    tabs/route.ts       # GET worksheets live from Graph API
    settings/route.ts   # GET/POST tab config
    cron/route.ts       # Vercel Cron endpoint, every 10 min
  login/page.tsx        # Microsoft sign-in page
  layout.tsx            # Root layout — Inter font
  components/
    AutoRefresh.tsx     # Invisible — 9-min silent router.refresh() interval
    HeaderTimestamp.tsx # Async server component — fetches lastRefreshed
    RefreshButton.tsx   # Last synced text + manual Refresh button
    PMBoard.tsx         # PM card with table and selectedRow state
    JobRow.tsx          # Clickable row with status colour coding
    JobDetailCard.tsx   # Modal — fixed header/columns/footer, scrollable rows
    StatusBadge.tsx     # Single pill badge (Install / Overdue / Due Soon)
    StatusBadges.tsx    # Install + status badge pair
    TabSelector.tsx     # Settings tab selector with Save flow
    PMList.tsx          # Settings read-only PM list
lib/
  graph.ts              # Graph API — token, graphGet, listWorksheets, getWorksheetRange
  excel.ts              # Parsers — parsePMMap, parseDataTab, Excel date conversion
  grouping.ts           # buildDashboard — groups rows, sums values, sorts
  cache.ts              # Redis read/write — getDashboard, setDashboard, tab config
  worker.ts             # Full pipeline — runWorker, getDashboardOrRefresh, refreshDashboard
  formatting.ts         # getRowStatus, formatGBP, formatDate, formatLastRefreshed
  api.ts                # jsonRoute() — shared error-handling wrapper for API routes
  types.ts              # All shared TypeScript types
config/
  columns.ts            # COLUMN_MAP — Excel column indices (single source of truth)
  constants.ts          # REDIS_KEYS, ALWAYS_READ_TABS, CACHE_REFRESH_MINUTES
auth.ts                 # NextAuth config — provider, tenant lock, domain check
proxy.ts                # Route protection middleware
vercel.json             # Cron schedule — /api/cron every 10 minutes
```
