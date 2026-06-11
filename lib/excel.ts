import type { PMMap, ParsedRow } from '@/lib/types'
import { COLUMN_MAP as COL } from '@/config/columns'

// --- Stage 4: List tab parser ---

// Reads the List tab's usedRange values and builds a PM initials → full name map.
// Row 0 is always the header; blank initials or names are silently discarded.
export function parsePMMap(rows: unknown[][]): PMMap {
  const map: PMMap = {}

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i]
    const initials = String(row?.[0] ?? '').trim()
    const name     = String(row?.[1] ?? '').trim()
    if (initials && name) {
      map[initials] = name
    }
  }

  return map
}

// --- Stage 5: Data tab parser ---

// Parses one data worksheet's usedRange values into ParsedRows.
// Skips header (row 0), discards rows with blank jobNumber or unknown PM.
export function parseDataTab(rows: unknown[][], pmMap: PMMap, tabName: string): ParsedRow[] {
  const result: ParsedRow[] = []

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i]

    const jobNumber  = String(row?.[COL.jobNumber]  ?? '').trim()
    const pmInitials = String(row?.[COL.pmInitials] ?? '').trim()

    if (!jobNumber)               continue // blank job number → discard
    if (!(pmInitials in pmMap))   continue // unknown PM → discard

    result.push({
      jobNumber,
      customerName: String(row?.[COL.customerName] ?? '').trim(),
      pmInitials,
      line: {
        description:    String(row?.[COL.description]    ?? '').trim(),
        quantity:       toNumber(row?.[COL.quantity]),
        deliveryOption: String(row?.[COL.deliveryOption] ?? '').trim(),
        requiredByDate: parseExcelDate(row?.[COL.requiredByDate]),
        itemValue:      toNumber(row?.[COL.itemValue]),
        lineTotal:      toNumber(row?.[COL.lineTotal]),
        sourceTab:      tabName,
      },
    })
  }

  return result
}

// Coerces a cell value to a number; returns 0 for blank/NaN cells.
function toNumber(value: unknown): number {
  const n = Number(value)
  return isNaN(n) ? 0 : n
}

// Converts an Excel date to an ISO date string (YYYY-MM-DD).
// Graph API returns date cells as Excel serial numbers (numeric).
// Falls back to direct Date parsing for pre-formatted string values.
function parseExcelDate(value: unknown): string {
  if (typeof value === 'number' && value > 0) {
    // Excel serial: days since 1899-12-30 (accounts for 1900 leap-year bug)
    const ms = (value - 25569) * 86400 * 1000
    return new Date(ms).toISOString().split('T')[0]
  }
  if (typeof value === 'string' && value.trim()) {
    const d = new Date(value)
    if (!isNaN(d.getTime())) return d.toISOString().split('T')[0]
  }
  return ''
}