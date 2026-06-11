import { describe, it, expect } from 'vitest'
import { buildDashboard } from '@/lib/grouping'
import type { ParsedRow, PMMap } from '@/lib/types'

const PM_MAP: PMMap = {
  AB: 'Alice Brown',
  CD: 'Charlie Davis',
}

function makeRow(
  overrides: Partial<{
    jobNumber: string
    customerName: string
    pmInitials: string
    description: string
    quantity: number
    deliveryOption: string
    requiredByDate: string
    itemValue: number
    lineTotal: number
    sourceTab: string
  }> = {},
): ParsedRow {
  const defaults = {
    jobNumber: 'J1000',
    customerName: 'Acme Ltd',
    pmInitials: 'AB',
    description: 'Widget',
    quantity: 1,
    deliveryOption: 'Delivery',
    requiredByDate: '2025-06-01',
    itemValue: 100,
    lineTotal: 100,
    sourceTab: 'Jan25',
  }
  const merged = { ...defaults, ...overrides }
  return {
    jobNumber: merged.jobNumber,
    customerName: merged.customerName,
    pmInitials: merged.pmInitials,
    line: {
      description: merged.description,
      quantity: merged.quantity,
      deliveryOption: merged.deliveryOption,
      requiredByDate: merged.requiredByDate,
      itemValue: merged.itemValue,
      lineTotal: merged.lineTotal,
      sourceTab: merged.sourceTab,
    },
  }
}

describe('buildDashboard', () => {
  it('returns empty boards for empty input', () => {
    const result = buildDashboard([], PM_MAP, [])
    expect(result.boards).toEqual([])
    expect(result.tabsProcessed).toEqual([])
    expect(result.lastRefreshed).toBeTruthy()
  })

  it('groups a single row into one board with one tableRow', () => {
    const result = buildDashboard([makeRow()], PM_MAP, ['Jan25'])
    expect(result.boards).toHaveLength(1)
    const board = result.boards[0]
    expect(board.pmInitials).toBe('AB')
    expect(board.projectManager).toBe('Alice Brown')
    expect(board.totalProjects).toBe(1)
    expect(board.totalValue).toBe(100)
    expect(board.tableRows).toHaveLength(1)
  })

  it('merges two rows with the same job number and date into one JobDateGroup', () => {
    const rows = [
      makeRow({ jobNumber: 'J1042', requiredByDate: '2025-06-01', lineTotal: 200 }),
      makeRow({ jobNumber: 'J1042', requiredByDate: '2025-06-01', lineTotal: 300 }),
    ]
    const result = buildDashboard(rows, PM_MAP, [])
    const board = result.boards[0]
    expect(board.tableRows).toHaveLength(1)
    expect(board.tableRows[0].totalValue).toBe(500)
    expect(board.tableRows[0].productLines).toHaveLength(2)
  })

  it('creates separate JobDateGroups for same job with different dates', () => {
    const rows = [
      makeRow({ jobNumber: 'J1042', requiredByDate: '2025-07-01', lineTotal: 100 }),
      makeRow({ jobNumber: 'J1042', requiredByDate: '2025-06-01', lineTotal: 200 }),
    ]
    const result = buildDashboard(rows, PM_MAP, [])
    const board = result.boards[0]
    expect(board.tableRows).toHaveLength(2)
    // totalProjects counts unique job numbers, so still 1
    expect(board.totalProjects).toBe(1)
    expect(board.totalValue).toBe(300)
  })

  it('sorts tableRows by requiredByDate ascending', () => {
    const rows = [
      makeRow({ requiredByDate: '2025-08-01', lineTotal: 10 }),
      makeRow({ jobNumber: 'J1001', requiredByDate: '2025-06-01', lineTotal: 20 }),
      makeRow({ jobNumber: 'J1002', requiredByDate: '2025-07-01', lineTotal: 30 }),
    ]
    const result = buildDashboard(rows, PM_MAP, [])
    const dates = result.boards[0].tableRows.map((r) => r.requiredByDate)
    expect(dates).toEqual(['2025-06-01', '2025-07-01', '2025-08-01'])
  })

  it('puts blank requiredByDate rows at the end', () => {
    const rows = [
      makeRow({ jobNumber: 'J1001', requiredByDate: '', lineTotal: 10 }),
      makeRow({ jobNumber: 'J1002', requiredByDate: '2025-06-01', lineTotal: 20 }),
    ]
    const result = buildDashboard(rows, PM_MAP, [])
    const dates = result.boards[0].tableRows.map((r) => r.requiredByDate)
    expect(dates).toEqual(['2025-06-01', ''])
  })

  it('sets hasInstall=true when any line deliveryOption contains "install" (case-insensitive)', () => {
    const rows = [
      makeRow({ jobNumber: 'J1042', requiredByDate: '2025-06-01', deliveryOption: 'Delivery' }),
      makeRow({ jobNumber: 'J1042', requiredByDate: '2025-06-01', deliveryOption: 'Install' }),
    ]
    const result = buildDashboard(rows, PM_MAP, [])
    expect(result.boards[0].tableRows[0].hasInstall).toBe(true)
  })

  it('sets hasInstall=true for lowercase "install"', () => {
    const rows = [makeRow({ deliveryOption: 'install and collect' })]
    const result = buildDashboard(rows, PM_MAP, [])
    expect(result.boards[0].tableRows[0].hasInstall).toBe(true)
  })

  it('sets hasInstall=false when no line has install delivery', () => {
    const rows = [makeRow({ deliveryOption: 'Delivery' })]
    const result = buildDashboard(rows, PM_MAP, [])
    expect(result.boards[0].tableRows[0].hasInstall).toBe(false)
  })

  it('separates rows for different PMs into different boards', () => {
    const rows = [
      makeRow({ pmInitials: 'AB', jobNumber: 'J1000', lineTotal: 100 }),
      makeRow({ pmInitials: 'CD', jobNumber: 'J2000', lineTotal: 200 }),
    ]
    const result = buildDashboard(rows, PM_MAP, [])
    expect(result.boards).toHaveLength(2)
    const initials = result.boards.map((b) => b.pmInitials).sort()
    expect(initials).toEqual(['AB', 'CD'])
  })

  it('sorts boards alphabetically by pmInitials', () => {
    const rows = [
      makeRow({ pmInitials: 'CD', jobNumber: 'J2000' }),
      makeRow({ pmInitials: 'AB', jobNumber: 'J1000' }),
    ]
    const result = buildDashboard(rows, PM_MAP, [])
    expect(result.boards[0].pmInitials).toBe('AB')
    expect(result.boards[1].pmInitials).toBe('CD')
  })

  it('totalProjects counts unique job numbers, not total rows', () => {
    const rows = [
      makeRow({ jobNumber: 'J1000', requiredByDate: '2025-06-01' }),
      makeRow({ jobNumber: 'J1000', requiredByDate: '2025-07-01' }),
      makeRow({ jobNumber: 'J1001', requiredByDate: '2025-06-01' }),
    ]
    const result = buildDashboard(rows, PM_MAP, [])
    expect(result.boards[0].totalProjects).toBe(2)
  })

  it('sets tabsProcessed on the result', () => {
    const result = buildDashboard([], PM_MAP, ['Jan25', 'Feb25'])
    expect(result.tabsProcessed).toEqual(['Jan25', 'Feb25'])
  })

  it('falls back to pmInitials as projectManager if initials not in pmMap', () => {
    const rows = [makeRow({ pmInitials: 'ZZ' })]
    const result = buildDashboard(rows, PM_MAP, [])
    expect(result.boards[0].projectManager).toBe('ZZ')
  })
})
