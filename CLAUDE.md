@AGENTS.md

# Claude Code notes for this project

## What has been built (Stages 1–12 + refactor)

- Next.js 16 scaffolded at `Frontend/unibox-project-board/`
- Auth: NextAuth v5 beta with MicrosoftEntraID — tenant-locked + `@unibox.co.uk` domain check
- Route protection in `proxy.ts` (Next.js 16 renamed middleware → proxy)
- Microsoft Graph API connection in `lib/graph.ts` — app-only client credentials, `graphGet` helper
- List tab parser (`parsePMMap`) and data tab parser (`parseDataTab`) in `lib/excel.ts` — `cellText` + `toIsoDate` helpers
- Job grouping in `lib/grouping.ts` — `buildDashboard` groups by jobNumber+date, sums values, detects Install
- Redis cache in `lib/cache.ts` — Upstash lazy singleton, dashboard + tab config read/write
- Full worker pipeline in `lib/worker.ts` — `runWorker`, `getDashboardOrRefresh` cold-start fallback, `refreshDashboard` slim response helper
- `lib/api.ts` — `jsonRoute(label, handler)` shared error-handling wrapper used by all API routes
- Vercel Cron at `/api/cron` (every 10 min), protected by `CRON_SECRET`
- Settings page at `/settings` — tab selector + read-only PM list
- API routes: `/api/jobs` (GET), `/api/refresh` (POST), `/api/settings` (GET/POST), `/api/tabs` (GET)
- Home dashboard: `app/(protected)/page.tsx` server component, PM grid (2-col desktop / 1-col mobile)
- `lib/formatting.ts`: `getRowStatus`, `formatLastRefreshed`, `formatGBP`, `formatDate` — single source for all formatters
- Components: `StatusBadge` (single pill), `StatusBadges` (Install+status trio), `JobRow` (clickable, status colours), `PMBoard` (card + table, selectedRow state), `RefreshButton` (POST /api/refresh + router.refresh())
- `JobDetailCard`: modal overlay, backdrop + Escape to close, status-tinted header with badges, product lines table, group total footer
- Unit tests passing via Vitest (`npm test`)

## Decisions made during build

- `tenantId` prop does not exist on MicrosoftEntraID in this beta version — use `issuer` URL instead
- Azure AD redirect URI must be `.../callback/microsoft-entra-id` (not `azure-ad`)
- Graph API returns Excel date cells as serial numbers — convert via `(serial - 25569) * 86400000`
- `app/page.tsx` (scaffold default) was deleted — `app/(protected)/page.tsx` handles `/`
- `middleware.ts` was renamed to `proxy.ts` to fix Next.js 16 deprecation warning
- `/api/jobs` cold-start: if Redis cache is empty, `getDashboardOrRefresh` runs the worker inline rather than returning a 404
- Cron endpoint uses `CRON_SECRET` header/query param for auth (Vercel passes it as a header)

## Next stage

Stage 13: polish — loading skeletons, error boundaries, mobile layout review.
