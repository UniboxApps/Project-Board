# Unibox Project Board — Full Build Plan

---

## Build Status — Last updated 2026-06-12 (Stage 13 complete + deployed to Vercel)

**App location:** `Frontend/unibox-project-board/`
**GitHub:** `https://github.com/paulrbolton/unibox-project-board`
**Production:** `https://unibox-project-board.vercel.app`

| Stage | Task | Status | Notes |
|---|---|---|---|
| 1 | Scaffold Next.js 16, TypeScript, Tailwind, shadcn/ui | ✅ Done | Next.js 16.2.9 (not 15). Full folder structure created. |
| 2 | NextAuth v5 + Azure AD, tenant-locked, @unibox.co.uk check | ✅ Done | Use `issuer` URL not `tenantId` prop. Redirect URI must end in `/microsoft-entra-id`. Route protection in `proxy.ts` (not `middleware.ts`). |
| 3 | Microsoft Graph API connection | ✅ Done | App-only client credentials. `lib/graph.ts`: `listWorksheets`, `getWorksheetRange`. `/api/tabs` live. `/api/test-graph` for dev testing. |
| 4 | List tab parser — PMMap | ✅ Done | `parsePMMap` in `lib/excel.ts`. 7 unit tests passing. |
| 5 | Data tab parser — column mapping, ParsedRow objects | ✅ Done | `parseDataTab` in `lib/excel.ts`. Excel serial date conversion. `ParsedRow` type added. 17 unit tests total passing. |
| 6 | Job grouping logic | ✅ Done | `buildDashboard` in `lib/grouping.ts`. Groups by jobNumber+date composite key, sums values, detects Install. Blank dates sort last. Boards sorted alphabetically by PM initials. Unit tests passing. |
| 7 | Redis cache layer (Upstash) | ✅ Done | `lib/cache.ts`. `getDashboard`/`setDashboard` + `getSelectedTabs`/`setSelectedTabs`. Lazy Redis singleton. ALWAYS_READ_TABS merged automatically on read. |
| 8 | Background worker — full pipeline + cron | ✅ Done | `lib/worker.ts`: `runWorker` (full pipeline) + `getDashboardOrRefresh` (cold-start fallback). `/api/cron` Vercel cron endpoint protected by `CRON_SECRET`. Cron schedule in `vercel.json` (every 10 min). |
| 9 | Settings page — tab selector + PM list | ✅ Done | `/api/settings` GET/POST wired to Redis. Settings UI at `app/(protected)/settings/page.tsx`. |
| 10 | API routes — /api/jobs, /api/refresh, /api/settings | ✅ Done | `/api/jobs` GET returns `CachedDashboard` (with cold-start refresh). `/api/refresh` POST triggers `runWorker`. `/api/settings` GET/POST persists tab selection. All tested. |
| 11 | Home dashboard UI | ✅ Done | PM grid (2-col desktop / 1-col mobile). StatusBadge (Install/Overdue/Due Soon), JobRow with row colouring, PMBoard card, RefreshButton with last-synced. suppressHydrationWarning on relative timestamp. |
| 12 | Job detail card — modal | ✅ Done | `JobDetailCard.tsx` modal overlay. Backdrop click + Escape to close. Header tinted by row status. Product lines table with group total footer. Wired into PMBoard via selectedRow state. |
| 13 | Polish — skeletons, error boundaries, auto-refresh, mobile | ✅ Done | See "Stage 13 notes" section below. |
| — | Vercel deployment | ✅ Done | GitHub → Vercel auto-deploy on push to master. See deployment section below. |
| — | Refactor + code-simplifier pass | ✅ Done | See "Refactor notes" section below. |
| — | Job detail card scroll fix | ✅ Done | Card capped at 90vh. Header, column headers, and footer fixed. Only line items scroll. |

### Stage 13 notes (2026-06-12)

- **`app/(protected)/loading.tsx`** — animated 2-card skeleton grid shown on navigation to the dashboard. Matches the `grid grid-cols-1 xl:grid-cols-2` layout to prevent layout shift.
- **`app/(protected)/error.tsx`** — client component error boundary. Shows a red-tinted panel with error digest and a "Try again" button calling `reset()`.
- **`app/components/AutoRefresh.tsx`** — invisible client component mounted in the layout. Sets a 9-minute interval that calls `router.refresh()` to silently re-fetch server components. Does not show the loading skeleton (that only fires on navigation, not `router.refresh()`).
- **`app/components/HeaderTimestamp.tsx`** — async server component that fetches `lastRefreshed` from Redis in isolation and renders `<RefreshButton>`. Wrapped in `<Suspense>` in the layout so the Redis call no longer blocks the entire header from rendering.
- **`app/(protected)/layout.tsx`** — removed the blocking `await getDashboard()`. Uses `<Suspense><HeaderTimestamp /></Suspense>`. Added `<AutoRefresh />`. Responsive two-row mobile header: brand + sign-out always visible; Settings link + refresh button move to a second row below `md` breakpoint.
- **`app/components/RefreshButton.tsx`** — simplified to fully prop-driven. Removed `useState` for the timestamp; renders the `lastRefreshed` prop directly. `router.refresh()` after a manual refresh causes the server to re-render the layout with the fresh timestamp.

### Refactor notes (2026-06-12)

A manual refactor followed by the code-simplifier plugin was run after Stage 12. No behaviour changed — all 51 tests pass and TypeScript is clean.

**New files added:**
- `lib/api.ts` — `jsonRoute(label, handler)` wraps the shared try/catch + 500 error response pattern; all five API routes now use it
- `app/components/StatusBadges.tsx` — combined Install/Overdue/Due-Soon badge trio; replaces the duplicated badge rendering in `JobRow` and `JobDetailCard`

**Consolidations:**
- `lib/formatting.ts` — now also exports `formatGBP` and `formatDate`; removed from the three component files that each had their own copy
- `lib/excel.ts` — `cellText(row, col)` replaces 7 repeated `String(row?.[x] ?? '').trim()` calls; `toIsoDate(d)` deduplicates the ISO date conversion
- `lib/graph.ts` — `graphGet(label, path)` extracted for the shared token + fetch + error-check + JSON pattern used by both `listWorksheets` and `getWorksheetRange`
- `lib/worker.ts` — `refreshDashboard()` added returning the `{ lastRefreshed, tabsProcessed }` shape that `/api/refresh` and `/api/cron` were building inline
- `lib/cache.ts` — dropped redundant intermediate variable in `getSelectedTabs`
- `app/components/StatusBadge.tsx` — merged parallel `styles` and `labels` maps into a single `badges` record
- `app/components/JobDetailCard.tsx` — removed redundant `groupTotal` reduce; uses `row.totalValue` which `buildDashboard` already computes
- `app/(protected)/layout.tsx` — merged two separate `@/auth` imports into one
- `app/layout.tsx` — fixed default Next.js scaffold metadata (title/description)

---

### Deployment (2026-06-12)

- **GitHub:** `https://github.com/paulrbolton/unibox-project-board` — git repo lives inside `Frontend/unibox-project-board/` (repo root is the Next.js app, not the parent folder)
- **Vercel:** `https://unibox-project-board.vercel.app` — connected to GitHub, auto-deploys on every push to `master`
- **Azure redirect URI added:** `https://unibox-project-board.vercel.app/api/auth/callback/microsoft-entra-id`
- **`CRON_SECRET`** added to both `.env.local` and Vercel environment variables
- **`NEXTAUTH_URL`** set to `https://unibox-project-board.vercel.app` in Vercel (remains `http://localhost:3000` in `.env.local`)

### Deviations from original plan

| Item | Plan said | Reality |
|---|---|---|
| Next.js version | 15 | 16.2.9 (latest at scaffold time) |
| Middleware file | `middleware.ts` | `proxy.ts` (Next.js 16 renamed it) |
| MicrosoftEntraID option | `tenantId` prop | `issuer` URL — prop doesn't exist in this beta |
| Azure AD callback path | `/callback/azure-ad` | `/callback/microsoft-entra-id` |
| Root page | Redirect to dashboard | `app/page.tsx` deleted — `app/(protected)/page.tsx` handles `/` directly |

---

## Overview

A Next.js web app that pulls data from a SharePoint-hosted Excel file, processes it into a
project board grouped by project manager, with authentication restricted to Unibox.co.uk
accounts, a settings page for tab management, and a responsive home dashboard.

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 15 (App Router) |
| Auth | NextAuth.js v5 with Microsoft Entra ID (Azure AD) |
| Data Source | SharePoint/Excel via Microsoft Graph API |
| Styling | Tailwind CSS + shadcn/ui |
| State/Cache | TanStack Query (React Query) |
| Background Jobs | Vercel Cron or Node cron (depending on hosting) |
| Cache/Storage | Redis via Upstash (free tier) |
| Deployment | Vercel or self-hosted Node server |

---

## Part 1: Authentication

Use **NextAuth.js with Microsoft Entra ID (Azure AD)** as the provider.

### Rules
- The Azure AD provider is configured with your specific **tenant ID** so only your
  Microsoft 365 organisation can authenticate
- A secondary check in the NextAuth `signIn` callback verifies the email domain ends
  with `@unibox.co.uk` as a belt-and-braces fallback
- All routes under `/(protected)` require an active session
- Unauthenticated users are redirected to a login page

### Azure AD App Registration Requirements
The following Microsoft Graph API permissions must be granted and admin-consented in the
Azure Portal:
- `User.Read`
- `Files.Read.All`
- `Sites.Read.All`

### Environment Variables Required
```
AZURE_AD_CLIENT_ID=your-client-id
AZURE_AD_CLIENT_SECRET=your-client-secret
AZURE_AD_TENANT_ID=your-tenant-id
NEXTAUTH_SECRET=any-long-random-string
NEXTAUTH_URL=http://localhost:3000
SHAREPOINT_FILE_PATH=/sites/your-site/drives/your-drive/items/your-file-id
UPSTASH_REDIS_REST_URL=your-upstash-url
UPSTASH_REDIS_REST_TOKEN=your-upstash-token
```

---

## Part 2: Data Architecture — Option A (Graph API + Redis Cache)

This is the confirmed approach.

```
SharePoint Excel → Graph API → Background Worker → Redis Cache → Next.js API Routes → UI
```

### How It Works
- A background worker runs on a schedule (every 10 minutes) and also on manual trigger
- The worker reads the Excel file via the Microsoft Graph API
- It processes raw rows into clean structured job objects
- The result is stored in Redis
- The Next.js frontend reads only from Redis — never directly from Excel
- A "Last synced: X mins ago" indicator in the UI keeps users informed

### Why This Approach
- The UI is always fast — it reads from cache, never from Excel directly
- Excel is only hit every N minutes, not on every page load
- Handles large files with many tabs and many rows efficiently
- Supports a manual refresh button for when users need up-to-date data immediately

---

## Part 3: The Excel File Structure

### Special Tab — List
The **List** tab is always read automatically on every worker run. It is never toggled
off and is not shown as selectable in the Settings page. It is the single source of
truth for which project managers are tracked.

- **Column A** — PM Initials
- **Column B** — PM Full Name

The worker builds a lookup map from this tab on every run:
```typescript
type PMMap = Record<string, string>
// Example: { "SJ": "Sarah Jones", "MD": "Mark Davies" }
```

If a person is added or removed from the List tab in Excel, the change is automatically
reflected on the next cache refresh with no app changes required.

### Data Tabs — Column Mapping

All selected data tabs share the same column layout. The mapping is 0-indexed:

| Column Letter | Index | Field Name | Description |
|---|---|---|---|
| A | 0 | `jobNumber` | Job number — the primary grouping key |
| B | 1 | `customerName` | Customer name |
| C | 2 | `description` | Product/item description — shown in detail card |
| D | 3 | `quantity` | Quantity of this line item |
| N | 13 | `deliveryOption` | Delivery type — rows containing "Install" are flagged |
| O | 14 | `requiredByDate` | Date work must be completed before shipping — used for sorting |
| V | 21 | `pmInitials` | PM initials — matched against List tab |
| Y | 24 | `itemValue` | Unit value of this line item |
| Z | 25 | `lineTotal` | Total value (qty × item value) |

### Row Filtering Rules (applied per worker run)
- If Column V (PM initials) is **not** in the PMMap → discard row silently
- If Column A (job number) is blank → discard row silently
- All other rows are kept and mapped to a `ProductLine` object

---

## Part 4: Data Models

```typescript
type ProductLine = {
  description: string        // Column C
  quantity: number           // Column D
  deliveryOption: string     // Column N — raw value, checked for "Install"
  requiredByDate: string     // Column O — stored as ISO date string
  itemValue: number          // Column Y
  lineTotal: number          // Column Z
  sourceTab: string          // Which worksheet this line came from
}

type JobDateGroup = {
  jobNumber: string
  customerName: string
  requiredByDate: string     // The date this specific group is due
  totalValue: number         // Sum of lineTotal for all lines in this job+date group
  hasInstall: boolean        // True if ANY line in this group has "Install" in Column N
  productLines: ProductLine[] // All individual lines — used for the detail card
}

type Job = {
  jobNumber: string
  customerName: string
  projectManager: string     // Full name resolved from List tab
  pmInitials: string
  dateGroups: JobDateGroup[] // One entry per unique requiredByDate — sorted ascending
}

type PMBoard = {
  pmInitials: string
  projectManager: string     // Full name from List tab
  totalProjects: number      // Count of unique job numbers for this PM
  totalValue: number         // Sum of all JobDateGroup.totalValue for this PM
  tableRows: JobDateGroup[]  // Flat sorted list of all date groups — what renders in the table
}

// Root object stored in Redis
type CachedDashboard = {
  boards: PMBoard[]
  lastRefreshed: string      // ISO timestamp
  tabsProcessed: string[]    // Which tabs were included in this run
}
```

---

## Part 5: Job Grouping Logic

This is the critical data processing step.

**Rule:** Group all product lines by **Job Number + Required By Date** as a composite key.
If the same job number has lines with different required dates, they become separate table
rows. Values are summed within each group.

### Algorithm
```
1. Read PMMap from List tab
2. For each selected data tab:
   a. Fetch usedRange via Graph API
   b. Skip header row (row 0)
   c. For each data row:
      - Discard if Column A is blank
      - Discard if Column V not in PMMap
      - Map remaining columns to a ProductLine object
3. Collect all ProductLines across all tabs
4. Group by composite key: jobNumber + requiredByDate
5. For each group:
   - customerName: from first line in group
   - totalValue: sum of all lineTotal values
   - hasInstall: true if any line has deliveryOption containing "Install" (case-insensitive)
   - productLines: all individual lines (for detail card)
6. Group all JobDateGroups by pmInitials
7. For each PM: sort their groups by requiredByDate ascending
8. Build PMBoard objects with totalProjects and totalValue summaries
9. Store CachedDashboard in Redis
```

### Example
Raw lines for Job J1042, PM: SJ:

| Tab | Job | Customer | Date | Line Total | Delivery |
|---|---|---|---|---|---|
| Tab1 | J1042 | Acme Ltd | 15 Jun | £500 | — |
| Tab1 | J1042 | Acme Ltd | 15 Jun | £300 | Install |
| Tab2 | J1042 | Acme Ltd | 22 Jun | £800 | — |

Results in **two table rows**:

| Job | Customer | Total Value | Due Date | Install |
|---|---|---|---|---|
| J1042 | Acme Ltd | £800 | 15 Jun | ✅ Badge shown |
| J1042 | Acme Ltd | £800 | 22 Jun | — |

---

## Part 6: Settings Page

### Section 1 — Tab Selection
- Fetches the full list of all worksheets in the workbook live from the Graph API
- Displays every tab as a toggleable checkbox list
- The **List** tab is shown but locked/greyed out with a label: *"Always active — PM source"*
- A **Save** button persists the selected tabs to a Redis config key
- A note reads: *"Changes take effect on the next data refresh"*
- A **Refresh Now** button triggers an immediate worker run with the updated tab selection

### Section 2 — Current Project Managers (read-only)
- Displays the current contents of the List tab: initials + full name
- Labelled: *"These are read live from the List tab in Excel. Edit the spreadsheet to update this list."*
- Makes it clear that PM management happens in Excel, not in the app

---

## Part 7: Home Dashboard

### Layout
A responsive grid of PM cards — 2 columns on desktop, 1 column on mobile. One card per
project manager found in the List tab.

### PM Card Structure

```
┌─────────────────────────────────────────────────────────┐
│  Sarah Jones                                            │
│  12 Projects  ·  Total Value: £148,450                  │
├─────────────┬──────────────────┬───────────┬────────────┤
│  Job No     │  Customer        │  Value    │  Due Date  │
├─────────────┼──────────────────┼───────────┼────────────┤
│  J1042      │  Acme Ltd        │  £800     │  15 Jun    │  ← Install badge
│  J1042      │  Acme Ltd        │  £800     │  22 Jun    │
│  J1089      │  Beta Corp       │  £2,400   │  Today     │  ← Amber warning
│  J1091      │  Gamma Co        │  £1,100   │  3 Jun     │  ← Red overdue
└─────────────┴──────────────────┴───────────┴────────────┘
```

### Row Formatting Rules

| Condition | Formatting |
|---|---|
| `hasInstall === true` | **Install** badge/pill shown on the row (orange or purple) — always visible regardless of other highlights |
| Due date is **today or tomorrow** (≤ 1 day away) | Row background amber/yellow — due soon warning |
| Due date is **in the past** | Row background red, date text bold — overdue |
| Normal future job | Default styling, no highlight |

Priority when multiple conditions apply: **Overdue > Due Soon > Install badge**
(Install badge always shows regardless of row highlight colour.)

### Header Bar
- Shows app name / logo
- **Last synced: X mins ago** timestamp
- **Refresh** button — calls `/api/refresh` and re-runs the worker pipeline
- User avatar / name from Microsoft SSO with sign-out option

---

## Part 8: Job Detail Card (Modal Overlay)

Clicking any table row opens a detail card **on top of the dashboard**. The tables behind
remain visible through a semi-transparent backdrop.

### Behaviour
- Opens centred on screen with a dimmed backdrop (tables visible behind it)
- Close via: the ✕ button, pressing Escape, or clicking the backdrop
- Shows only the product lines for the **specific date group that was clicked**
  (since each row represents one job + date combination)
- The Install badge is shown in the card header if `hasInstall` is true for that group
- Overdue / due soon colouring is mirrored in the card header

### Card Layout

```
┌──────────────────────────────────────────────────────────┐
│  Job J1042  ·  Acme Ltd                              ✕  │
│  Project Manager: Sarah Jones                            │
│  Due: 15 Jun 2025    [INSTALL]    [OVERDUE]              │
├───────────────────────┬───────┬──────────┬───────────────┤
│  Description          │  Qty  │  Item £  │  Total £      │
├───────────────────────┼───────┼──────────┼───────────────┤
│  Steel Panel 2400mm   │   4   │  £125.00 │  £500.00      │
│  Site Install Labour  │   1   │  £300.00 │  £300.00      │
├───────────────────────┴───────┴──────────┼───────────────┤
│                              Group Total │  £800.00      │
└──────────────────────────────────────────────────────────┘
```

---

## Part 9: App File Structure

```
/app
  /api
    /jobs/route.ts          → Returns CachedDashboard from Redis
    /refresh/route.ts       → Manually triggers worker pipeline
    /tabs/route.ts          → Lists all workbook worksheets (for Settings page)
    /settings/route.ts      → GET and POST selected tab config
    /auth/[...nextauth]/    → NextAuth route handler
  /(protected)
    /page.tsx               → Home dashboard — PM grid
    /settings/page.tsx      → Tab selector + PM list viewer
    /jobs/[id]/page.tsx     → (Optional) Full job detail page
  /components
    /PMBoard.tsx            → One PM's card with table
    /JobRow.tsx             → Single table row — clickable, triggers detail card
    /JobDetailCard.tsx      → Modal overlay with product line breakdown
    /TabSelector.tsx        → Settings page — checkbox list of all tabs
    /PMList.tsx             → Settings page — read-only PM list from List tab
    /RefreshButton.tsx      → Triggers refresh, shows last synced time
    /StatusBadge.tsx        → Install / Overdue / Due Soon badges
  /lib
    /graph.ts               → All Microsoft Graph API calls
    /excel.ts               → Row parsing, column mapping, data transformation
    /grouping.ts            → Job grouping and sorting logic
    /cache.ts               → Redis read/write helpers
    /worker.ts              → Full pipeline: fetch → filter → group → sort → cache
    /formatting.ts          → Row status logic (overdue / due-soon / normal)
  /config
    /columns.ts             → Column index map — single source of truth
    /constants.ts           → Redis keys, refresh interval, always-read tabs
```

---

## Part 10: Config Files

### config/columns.ts
```typescript
// Edit this file if the spreadsheet column layout ever changes
export const COLUMN_MAP = {
  jobNumber:       0,   // Column A
  customerName:    1,   // Column B
  description:     2,   // Column C
  quantity:        3,   // Column D
  deliveryOption:  13,  // Column N — checked for "Install"
  requiredByDate:  14,  // Column O
  pmInitials:      21,  // Column V
  itemValue:       24,  // Column Y
  lineTotal:       25,  // Column Z
}
```

### config/constants.ts
```typescript
export const ALWAYS_READ_TABS = ['List']   // Never toggled off — PM source

export const CACHE_REFRESH_MINUTES = 10   // How often the background worker runs

export const REDIS_KEYS = {
  dashboard:    'dashboard:cache',         // The full processed CachedDashboard
  tabConfig:    'settings:selected-tabs',  // Array of tab names to process
}
```

### lib/formatting.ts
```typescript
import { differenceInCalendarDays, parseISO, startOfDay } from 'date-fns'

export function getRowStatus(requiredByDate: string): 'overdue' | 'due-soon' | 'normal' {
  const today = startOfDay(new Date())
  const due = startOfDay(parseISO(requiredByDate))
  const daysUntil = differenceInCalendarDays(due, today)

  if (daysUntil < 0)  return 'overdue'    // Red highlight
  if (daysUntil <= 1) return 'due-soon'   // Amber highlight
  return 'normal'
}

// Install badge shown whenever hasInstall === true, regardless of row status
```

---

## Part 11: Build Order for Claude Code

Work through these stages **one at a time**. Complete and test each stage before moving
to the next. Do not scaffold the entire project at once.

| Stage | Task | Test |
|---|---|---|
| 1 | Scaffold Next.js 15 with TypeScript, Tailwind, shadcn/ui | `npm run dev` loads |
| 2 | NextAuth + Azure AD, tenant-locked, `@unibox.co.uk` domain check | Login/logout works |
| 3 | Microsoft Graph API connection, list worksheets, fetch one sheet | Raw data logs to console |
| 4 | List tab parser — reads List tab, builds PMMap | Unit test with mock data |
| 5 | Data tab parser — column mapping, row filtering, ProductLine objects | Unit test with mock data |
| 6 | Job grouping logic — group by job+date, sum values, detect Install | Unit test with mock data |
| 7 | Redis cache layer (Upstash) — read/write helpers for dashboard + tab config | Cache round-trip works |
| 8 | Background worker — full pipeline, cron schedule + manual trigger | Data appears in Redis |
| 9 | Settings page — tab selector, save to Redis, PM list viewer | Tabs save and persist |
| 10 | API routes — `/api/jobs`, `/api/refresh`, `/api/tabs`, `/api/settings` | Postman/browser test |
| 11 | Home dashboard — PM grid, tables, row formatting (Install/overdue/due-soon) | Visual check |
| 12 | Job detail card — modal overlay, product lines, close behaviours | Click test |
| 13 | Polish — loading skeletons, last synced timestamp, error boundaries, mobile layout | Full review |

---

## Part 12: Key Behaviours Reference

| Scenario | What Happens |
|---|---|
| New PM added to List tab in Excel | Picked up automatically on next cache refresh — no app changes needed |
| PM removed from List tab in Excel | Their board disappears from dashboard on next refresh |
| Tab deselected in Settings | Worker skips that tab on next run |
| Same job number spans multiple tabs | All product lines merged into one Job, grouped by date |
| Same job number has different dates | Separate table rows — one per unique date |
| A row has a blank job number | Silently discarded |
| A row's PM initials not in List tab | Silently discarded |
| Column layout changes in Excel | Update `COLUMN_MAP` in `config/columns.ts` only |
| "Install" appears in Column N | `hasInstall` set to true — Install badge shown on that row and in detail card |
| Due date is today or tomorrow | Row highlighted amber |
| Due date is in the past | Row highlighted red — overdue |
| User clicks a table row | Detail card opens over dashboard showing product lines for that job+date group |
| User presses Escape or clicks backdrop | Detail card closes |

---

## Part 13: Pre-Build Checklist

Before starting the build in Claude Code, have the following ready:

- [ ] Azure AD app registration created (needs M365 admin access)
- [ ] Application (client) ID noted
- [ ] Directory (tenant) ID noted
- [ ] Client secret created and copied (only shown once)
- [ ] Graph API permissions granted and admin-consented (`User.Read`, `Files.Read.All`, `Sites.Read.All`)
- [ ] Redirect URI added to app registration: `http://localhost:3000/api/auth/callback/azure-ad`
- [ ] SharePoint Excel file URL / path noted
- [ ] Upstash Redis account created (upstash.com — free tier)
- [ ] Upstash REST URL and token copied
- [ ] All values added to `.env.local` using the template in Part 1
- [ ] `PLAN.md` saved in the project root folder in VS Code

---

## Design notes (2026-06-12)

Applied after Stage 12 + refactor pass. These decisions are reflected in the codebase and should be maintained going forward.

### Font
- Replaced the default Geist scaffold font with **Inter** (Google Fonts, `next/font/google`)
- Variable `--font-sans` — picks up the Tailwind `font-sans` class automatically via `globals.css`

### Header layout
- Single horizontal bar across all protected pages (rendered in `app/(protected)/layout.tsx`)
- **Left:** "Unibox" (bold, large) + "Project Board" (small, grey) — the bold text is a placeholder for a PNG logo to be added later
- **Centre:** Navigation — currently one item: **Settings** link
- **Right:** Last synced timestamp + Refresh button | user name | Sign out
- The layout is a server component that calls `getDashboard()` from `lib/cache.ts` to read `lastRefreshed` for the header. This is a fast Redis read with no worker involvement.
- `RefreshButton` accepts `lastRefreshed: string | null` (null on first cold start before any data has been cached)
- The "Project Board" heading that was previously rendered in `page.tsx` has been removed — the header carries all branding

### PM card header
- Collapsed to a single flex row (was two lines)
- Left: PM full name with initials in parentheses — e.g. **Alison Crosbie (AC)**
- Right: project count · total value

### Currency formatting
- `formatGBP` changed to 0 decimal places (`minimumFractionDigits: 0, maximumFractionDigits: 0`)
- Applies everywhere: PM card total, job row value, detail card item/line/group totals

### Job row styling
- **Install badge** moved from the Due Date cell to sit inline with the job number
- **Overdue badge** also moved inline with the job number
- **Due Soon badge** stays in the Due Date cell (only status-type badge that remains there)
- **Install rows** get a yellow background (`bg-yellow-50 / hover:bg-yellow-100`) when status is normal or due-soon. Overdue takes colour priority over Install.
- Row padding reduced from `py-2.5` to `py-1.5` for a more compact table
- Priority order for row background: overdue (red) > due-soon (amber) > install (yellow) > normal

### Settings save flow
- The separate "Refresh Now" button has been removed from `TabSelector`
- Clicking **Save** now chains three steps automatically:
  1. POST `/api/settings` — persists the tab selection
  2. POST `/api/refresh` — runs the worker against the new tab list
  3. `router.push('/')` — returns the user to the dashboard
- Button label tracks progress: **Save** → **Saving…** → **Refreshing…** → redirect
- If either step fails, the button resets and an inline error message is shown

### Dev indicator
- `devIndicators: false` added to `next.config.ts` — hides the Next.js "N" build activity circle in development. Error overlays (hydration errors, runtime errors) are a separate system and are unaffected.
