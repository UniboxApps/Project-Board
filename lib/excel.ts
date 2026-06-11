import type { PMMap } from '@/lib/types'

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

// --- Stage 5: Data tab parser (added next stage) ---