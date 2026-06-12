import type { PMMap, ParsedRow } from '@/lib/types'
import { COLUMN_MAP as COL } from '@/config/columns'

// Reads a cell as a trimmed string, treating null/undefined as empty.
function cellText(row: unknown[] | undefined, col: number): string {
  return String(row?.[col] ?? '').trim()
}

// Reads the List tab's usedRange values and builds a PM initials → full name map.
// Row 0 is always the header; blank initials or names are silently discarded.
export function parsePMMap(rows: unknown[][]): PMMap {
  const map: PMMap = {}

  for (let i = 1; i < rows.length; i++) {
    const initials = cellText(rows[i], 0)
    const name     = cellText(rows[i], 1)
    if (initials && name) {
      map[initials] = name
    }
  }

  return map
}

// Parses one data worksheet's usedRange values into ParsedRows.
// Skips header (row 0), discards rows with blank jobNumber or unknown PM.
export function parseDataTab(rows: unknown[][], pmMap: PMMap, tabName: string): ParsedRow[] {
  const result: ParsedRow[] = []

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i]

    const jobNumber  = cellText(row, COL.jobNumber)
    const pmInitials = cellText(row, COL.pmInitials)

    if (!jobNumber)               continue // blank job number → discard
    if (!(pmInitials in pmMap))   continue // unknown PM → discard

    result.push({
      jobNumber,
      customerName: cellText(row, COL.customerName),
      pmInitials,
      line: {
        description:    cellText(row, COL.description),
        quantity:       toNumber(row?.[COL.quantity]),
        deliveryOption: cellText(row, COL.deliveryOption),
        requiredByDate: parseExcelDate(row?.[COL.requiredByDate]),
        itemValue:      toNumber(row?.[COL.itemValue]),
        lineTotal:      toNumber(row?.[COL.lineTotal]),
        sourceTab:      tabName,
      },
    })
  }

  return result
}

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
    return toIsoDate(new Date((value - 25569) * 86400 * 1000))
  }
  if (typeof value === 'string' && value.trim()) {
    return toIsoDate(new Date(value))
  }
  return ''
}

// Formats a Date as YYYY-MM-DD, returning '' for invalid dates.
function toIsoDate(d: Date): string {
  if (isNaN(d.getTime())) return ''
  return d.toISOString().split('T')[0]
}