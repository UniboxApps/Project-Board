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

## Build status (as of Stage 12 complete + design pass 2026-06-12)

Stages 1–12 are done. A refactor + code-simplifier pass was run, followed by a design pass (2026-06-12) — see PLAN.md for notes on both. Stage 13 (polish) is next.

| File | Purpose | Stage |
|---|---|---|
| `auth.ts` | NextAuth config — MicrosoftEntraID, tenant-locked, email domain check | 2 |
| `proxy.ts` | Route protection — redirects unauthenticated users to /login | 2 |
| `app/login/page.tsx` | Microsoft sign-in page | 2 |
| `app/(protected)/layout.tsx` | Header: brand (Unibox + Project Board), centre nav (Settings link), right (Last synced + Refresh + user + sign-out); reads lastRefreshed from cache | design |
| `app/layout.tsx` | Root layout — Inter font (sans-serif), antialiased | design |
| `next.config.ts` | `devIndicators: false` — hides Next.js dev "N" indicator | design |
| `lib/graph.ts` | Graph API: getGraphToken, graphGet helper, listWorksheets, getWorksheetRange | 3 |
| `app/api/tabs/route.ts` | Lists workbook worksheets live from Graph API | 3 |
| `app/api/test-graph/route.ts` | Dev test endpoint — remove before production | 3 |
| `lib/excel.ts` | parsePMMap, parseDataTab — uses cellText + toIsoDate helpers | 4–5 |
| `lib/types.ts` | PMMap, ProductLine, ParsedRow, JobDateGroup, Job, PMBoard, CachedDashboard | 4–5 |
| `config/columns.ts` | COLUMN_MAP — Excel column indices | 1 |
| `config/constants.ts` | REDIS_KEYS, ALWAYS_READ_TABS, CACHE_REFRESH_MINUTES | 1 |
| `lib/grouping.ts` | buildDashboard — groups ParsedRows by jobNumber+date composite key, sums values, detects Install, sorts by date asc | 6 |
| `lib/cache.ts` | getDashboard/setDashboard, getSelectedTabs/setSelectedTabs — Upstash Redis lazy singleton | 7 |
| `lib/worker.ts` | runWorker (full pipeline), getDashboardOrRefresh (cold-start fallback), refreshDashboard (returns slim response shape) | 8 |
| `lib/api.ts` | jsonRoute(label, handler) — shared try/catch + 500 error wrapper for all API routes | refactor |
| `app/api/cron/route.ts` | Vercel Cron endpoint — protected by CRON_SECRET, triggers runWorker | 8 |
| `vercel.json` | Cron schedule — /api/cron every 10 minutes | 8 |
| `app/(protected)/settings/page.tsx` | Tab selector UI + PM list viewer | 9 |
| `app/api/settings/route.ts` | GET/POST selected tab config to/from Redis | 9–10 |
| `app/api/jobs/route.ts` | GET CachedDashboard — cold-start triggers worker if cache empty | 10 |
| `app/api/refresh/route.ts` | POST — manually triggers runWorker, returns lastRefreshed + tabsProcessed | 10 |
| `lib/formatting.ts` | getRowStatus, formatLastRefreshed, formatGBP (0 dp), formatDate — all shared formatting in one place | 11 + design |
| `app/components/StatusBadge.tsx` | Single pill badge component — Install/Overdue/Due Soon variants | 11 |
| `app/components/StatusBadges.tsx` | Renders the Install + status badge trio; used by JobDetailCard | refactor |
| `app/components/JobRow.tsx` | Clickable row — Install+Overdue badges inline with job number; yellow highlight for Install rows; compact py-1.5 | design |
| `app/components/PMBoard.tsx` | PM card — single-line header: name (initials) left, project count + total right | design |
| `app/components/RefreshButton.tsx` | POST /api/refresh + router.refresh(); accepts `lastRefreshed: string \| null`; lives in header | design |
| `app/(protected)/page.tsx` | Server component — fetches CachedDashboard, renders 2-col PM grid (no page-level heading — header carries it) | 11 + design |
| `app/components/TabSelector.tsx` | Save → POST /api/settings → POST /api/refresh → router.push('/'); button label tracks each stage | design |
| `app/components/JobDetailCard.tsx` | Modal overlay — backdrop + Escape to close, status-tinted header, product lines table, uses row.totalValue for footer | 12 |

## Stages still to implement

13. Polish — loading skeletons, error boundaries, mobile layout
