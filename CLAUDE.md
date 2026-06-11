@AGENTS.md

# Claude Code notes for this project

## What has been built (Stages 1–5)

- Next.js 16 scaffolded at `Frontend/unibox-project-board/`
- Auth: NextAuth v5 beta with MicrosoftEntraID — tenant-locked + `@unibox.co.uk` domain check
- Route protection in `proxy.ts` (Next.js 16 renamed middleware → proxy)
- Microsoft Graph API connection in `lib/graph.ts` — app-only client credentials
- List tab parser (`parsePMMap`) and data tab parser (`parseDataTab`) in `lib/excel.ts`
- 17 unit tests passing via Vitest (`npm test`)

## Decisions made during build

- `tenantId` prop does not exist on MicrosoftEntraID in this beta version — use `issuer` URL instead
- Azure AD redirect URI must be `.../callback/microsoft-entra-id` (not `azure-ad`)
- Graph API returns Excel date cells as serial numbers — convert via `(serial - 25569) * 86400000`
- `app/page.tsx` (scaffold default) was deleted — `app/(protected)/page.tsx` handles `/`
- `middleware.ts` was renamed to `proxy.ts` to fix Next.js 16 deprecation warning

## Next stage

Stage 6: job grouping logic in `lib/grouping.ts`
