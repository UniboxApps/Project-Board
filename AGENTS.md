<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

# Project: Unibox Project Board

Next.js 16 app (App Router). Full specification is in `PLAN.md` one level above this folder. This file is a quick-reference for agents working on this codebase.

## Critical conventions — read before writing any code

- **Route protection file is `proxy.ts`** (not `middleware.ts` — that name is deprecated in Next.js 16)
- **Auth:** NextAuth v5 beta. Config is in `auth.ts` at the project root. Imports are `from 'next-auth'` and `from 'next-auth/providers/microsoft-entra-id'`.
- **`(protected)` route group** — serves at the same URL paths as if the folder wasn't there. `app/(protected)/page.tsx` → `/`. `app/(protected)/settings/page.tsx` → `/settings`.
- **Column indices** — never hardcode column numbers. Always import from `config/columns.ts`.
- **Types** — all shared types are in `lib/types.ts`. Do not define types inline in component or route files.
- **Testing** — Vitest. Run `npm test`. Test files live alongside source files as `*.test.ts`.
- **Package manager** — npm only.

## Build status (as of Stage 11 complete)

Stages 1–11 are done. Stage 12 (job detail modal) is next.

| File | Purpose | Stage |
|---|---|---|
| `auth.ts` | NextAuth config — MicrosoftEntraID, tenant-locked, email domain check | 2 |
| `proxy.ts` | Route protection — redirects unauthenticated users to /login | 2 |
| `app/login/page.tsx` | Microsoft sign-in page | 2 |
| `app/(protected)/layout.tsx` | Server session check + header/sign-out | 2 |
| `lib/graph.ts` | Graph API: getGraphToken, listWorksheets, getWorksheetRange | 3 |
| `app/api/tabs/route.ts` | Lists workbook worksheets live from Graph API | 3 |
| `app/api/test-graph/route.ts` | Dev test endpoint — remove before production | 3 |
| `lib/excel.ts` | parsePMMap (Stage 4), parseDataTab (Stage 5) | 4–5 |
| `lib/types.ts` | PMMap, ProductLine, ParsedRow, JobDateGroup, Job, PMBoard, CachedDashboard | 4–5 |
| `config/columns.ts` | COLUMN_MAP — Excel column indices | 1 |
| `config/constants.ts` | REDIS_KEYS, ALWAYS_READ_TABS, CACHE_REFRESH_MINUTES | 1 |
| `lib/grouping.ts` | buildDashboard — groups ParsedRows by jobNumber+date composite key, sums values, detects Install, sorts by date asc | 6 |
| `lib/cache.ts` | getDashboard/setDashboard, getSelectedTabs/setSelectedTabs — Upstash Redis lazy singleton | 7 |
| `lib/worker.ts` | runWorker (full pipeline) + getDashboardOrRefresh (cold-start fallback) | 8 |
| `app/api/cron/route.ts` | Vercel Cron endpoint — protected by CRON_SECRET, triggers runWorker | 8 |
| `vercel.json` | Cron schedule — /api/cron every 10 minutes | 8 |
| `app/(protected)/settings/page.tsx` | Tab selector UI + PM list viewer | 9 |
| `app/api/settings/route.ts` | GET/POST selected tab config to/from Redis | 9–10 |
| `app/api/jobs/route.ts` | GET CachedDashboard — cold-start triggers worker if cache empty | 10 |
| `app/api/refresh/route.ts` | POST — manually triggers runWorker, returns lastRefreshed + tabsProcessed | 10 |
| `lib/formatting.ts` | getRowStatus (overdue/due-soon/normal, vanilla JS), formatLastRefreshed ("X mins ago") | 11 |
| `app/components/StatusBadge.tsx` | Coloured pill badges — Install (purple), Overdue (red), Due Soon (amber) | 11 |
| `app/components/JobRow.tsx` | Client component — clickable row with status bg colours + badges, onSelect callback ready for Stage 12 | 11 |
| `app/components/PMBoard.tsx` | Client component — PM card with summary header + table, tracks selectedRow state for Stage 12 | 11 |
| `app/components/RefreshButton.tsx` | Client component — POST /api/refresh + router.refresh(), suppressHydrationWarning on relative timestamp | 11 |
| `app/(protected)/page.tsx` | Server component — fetches CachedDashboard via getDashboardOrRefresh, renders 2-col PM grid | 11 |

## Stages still to implement

12. Job detail modal — modal overlay with product line breakdown (`app/components/JobDetailCard.tsx`)  
13. Polish — loading skeletons, last synced timestamp, error boundaries, mobile layout
