import { getWorksheetRange } from '@/lib/graph'
import { parsePMMap, parseDataTab } from '@/lib/excel'
import { buildDashboard } from '@/lib/grouping'
import { getDashboard, setDashboard, getSelectedTabs } from '@/lib/cache'
import { ALWAYS_READ_TABS } from '@/config/constants'
import type { CachedDashboard, ParsedRow } from '@/lib/types'

// Runs the full pipeline:
//   List tab → PMMap
//   selected data tabs → ParsedRows
//   group → CachedDashboard
//   write to Redis
//
// Returns the freshly-built dashboard so callers can return it immediately.
export async function runWorker(): Promise<CachedDashboard> {
  // Step 1: build PM lookup map from the List tab
  const listRows = await getWorksheetRange('List')
  const pmMap = parsePMMap(listRows)

  // Step 2: determine which data tabs to process (excludes always-read tabs)
  const selectedTabs = await getSelectedTabs()
  const dataTabs = selectedTabs.filter((t) => !ALWAYS_READ_TABS.includes(t))

  // Step 3: fetch and parse each data tab, collecting all rows
  const allRows: ParsedRow[] = []
  const tabsProcessed: string[] = []

  for (const tab of dataTabs) {
    try {
      const rows = await getWorksheetRange(tab)
      const parsed = parseDataTab(rows, pmMap, tab)
      allRows.push(...parsed)
      tabsProcessed.push(tab)
    } catch (err) {
      // Log and skip — one bad tab should not break the whole run
      console.error(`[worker] skipping tab "${tab}":`, err instanceof Error ? err.message : err)
    }
  }

  // Step 4: group, sort, and build the dashboard
  const dashboard = buildDashboard(allRows, pmMap, tabsProcessed)

  // Step 5: persist to Redis
  await setDashboard(dashboard)

  return dashboard
}

// Returns the cached dashboard if available, otherwise runs the worker to
// generate one. Used by /api/jobs to guarantee a response even on cold start.
export async function getDashboardOrRefresh(): Promise<CachedDashboard> {
  const cached = await getDashboard()
  if (cached) return cached
  return runWorker()
}