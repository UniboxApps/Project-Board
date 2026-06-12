import type { ParsedRow, PMMap, ProductLine, JobDateGroup, PMBoard, CachedDashboard } from '@/lib/types'

type GroupAcc = {
  jobNumber: string
  customerName: string
  requiredByDate: string
  totalValue: number
  hasInstall: boolean
  productLines: ProductLine[]
}

// Groups ParsedRows into a CachedDashboard ready for the cache layer.
//
// Grouping rules:
//   1. Composite key = jobNumber + '|' + requiredByDate → one JobDateGroup per key
//   2. totalValue = sum of all lineTotal values in the group
//   3. hasInstall = true if any deliveryOption contains "install" (case-insensitive)
//   4. Each PM's groups are sorted by requiredByDate ascending (blank dates sort last)
//   5. totalProjects = count of unique jobNumbers per PM
//   6. totalValue on PMBoard = sum of all group totalValues for that PM
export function buildDashboard(
  rows: ParsedRow[],
  pmMap: PMMap,
  tabsProcessed: string[],
): CachedDashboard {
  // Step 1: accumulate rows into pm → compositeKey → group
  const pmGroups = new Map<string, Map<string, GroupAcc>>()

  for (const { pmInitials, jobNumber, customerName, line } of rows) {
    const key = `${jobNumber}|${line.requiredByDate}`

    if (!pmGroups.has(pmInitials)) pmGroups.set(pmInitials, new Map())
    const byKey = pmGroups.get(pmInitials)!

    if (!byKey.has(key)) {
      byKey.set(key, {
        jobNumber,
        customerName,
        requiredByDate: line.requiredByDate,
        totalValue: 0,
        hasInstall: false,
        productLines: [],
      })
    }

    const acc = byKey.get(key)!
    acc.totalValue += line.lineTotal
    if (/install/i.test(line.deliveryOption)) acc.hasInstall = true
    acc.productLines.push(line)
  }

  // Step 2: build PMBoard array
  const boards: PMBoard[] = []

  for (const [pmInitials, byKey] of pmGroups) {
    const projectManager = pmMap[pmInitials] ?? pmInitials

    const tableRows: JobDateGroup[] = Array.from(byKey.values())
      .sort((a, b) => compareDates(a.requiredByDate, b.requiredByDate))

    const uniqueJobs = new Set(tableRows.map((r) => r.jobNumber)).size
    const boardTotal = tableRows.reduce((sum, r) => sum + r.totalValue, 0)

    boards.push({
      pmInitials,
      projectManager,
      totalProjects: uniqueJobs,
      totalValue: boardTotal,
      tableRows,
    })
  }

  // Stable ordering: sort boards alphabetically by PM initials
  boards.sort((a, b) => a.pmInitials.localeCompare(b.pmInitials))

  return {
    boards,
    lastRefreshed: new Date().toISOString(),
    tabsProcessed,
  }
}

// Blank dates sort after real dates; otherwise lexicographic (ISO strings sort correctly)
function compareDates(a: string, b: string): number {
  if (!a && !b) return 0
  if (!a) return 1
  if (!b) return -1
  return a.localeCompare(b)
}