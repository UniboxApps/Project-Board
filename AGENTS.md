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

## Build status (as of Stage 5 complete)

Stages 1–5 are done. Stage 6 (job grouping) is next.

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

## Stages still to implement

6. `lib/grouping.ts` — group ParsedRows by jobNumber+date, build PMBoard objects  
7. `lib/cache.ts` — Upstash Redis read/write  
8. `lib/worker.ts` — full pipeline: fetch → parse → group → cache  
9. Settings page + `/api/settings`  
10. `/api/jobs`, `/api/refresh` wired up  
11. Home dashboard UI — PM cards, tables, Install/overdue/due-soon badges  
12. Job detail modal  
13. Polish — skeletons, error boundaries, mobile layout
