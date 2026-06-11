import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { CachedDashboard, PMMap, ParsedRow } from '@/lib/types'

// --- Mocks ---

const mockGetWorksheetRange = vi.fn()
vi.mock('@/lib/graph', () => ({
  getWorksheetRange: (...args: unknown[]) => mockGetWorksheetRange(...args),
}))

const mockParsePMMap = vi.fn()
const mockParseDataTab = vi.fn()
vi.mock('@/lib/excel', () => ({
  parsePMMap: (...args: unknown[]) => mockParsePMMap(...args),
  parseDataTab: (...args: unknown[]) => mockParseDataTab(...args),
}))

const mockBuildDashboard = vi.fn()
vi.mock('@/lib/grouping', () => ({
  buildDashboard: (...args: unknown[]) => mockBuildDashboard(...args),
}))

const mockGetDashboard = vi.fn()
const mockSetDashboard = vi.fn()
const mockGetSelectedTabs = vi.fn()
vi.mock('@/lib/cache', () => ({
  getDashboard: () => mockGetDashboard(),
  setDashboard: (...args: unknown[]) => mockSetDashboard(...args),
  getSelectedTabs: () => mockGetSelectedTabs(),
}))

// Import after mocks are registered
const { runWorker, getDashboardOrRefresh } = await import('@/lib/worker')

// --- Fixtures ---

const SAMPLE_PM_MAP: PMMap = { AB: 'Alice Brown' }
const SAMPLE_ROWS: unknown[][] = [['Initials', 'Name'], ['AB', 'Alice Brown']]
const SAMPLE_PARSED: ParsedRow[] = []
const SAMPLE_DASHBOARD: CachedDashboard = {
  boards: [],
  lastRefreshed: '2025-06-01T10:00:00.000Z',
  tabsProcessed: ['Jan25'],
}

beforeEach(() => {
  vi.clearAllMocks()
  // Default happy-path setup
  mockGetWorksheetRange.mockResolvedValue(SAMPLE_ROWS)
  mockParsePMMap.mockReturnValue(SAMPLE_PM_MAP)
  mockParseDataTab.mockReturnValue(SAMPLE_PARSED)
  mockGetSelectedTabs.mockResolvedValue(['List', 'Jan25'])
  mockBuildDashboard.mockReturnValue(SAMPLE_DASHBOARD)
  mockSetDashboard.mockResolvedValue(undefined)
})

describe('runWorker', () => {
  it('fetches the List tab first to build the PMMap', async () => {
    await runWorker()
    expect(mockGetWorksheetRange).toHaveBeenCalledWith('List')
    expect(mockParsePMMap).toHaveBeenCalledWith(SAMPLE_ROWS)
  })

  it('fetches each selected data tab and parses it', async () => {
    mockGetSelectedTabs.mockResolvedValue(['List', 'Jan25', 'Feb25'])
    mockGetWorksheetRange
      .mockResolvedValueOnce(SAMPLE_ROWS)   // List tab
      .mockResolvedValueOnce([['header']])   // Jan25
      .mockResolvedValueOnce([['header']])   // Feb25

    await runWorker()

    expect(mockGetWorksheetRange).toHaveBeenCalledWith('Jan25')
    expect(mockGetWorksheetRange).toHaveBeenCalledWith('Feb25')
    expect(mockParseDataTab).toHaveBeenCalledTimes(2)
  })

  it('does not pass the List tab to parseDataTab', async () => {
    await runWorker()
    const calls = mockParseDataTab.mock.calls
    const tabNames = calls.map((c) => c[2])
    expect(tabNames).not.toContain('List')
  })

  it('calls buildDashboard with combined rows from all tabs', async () => {
    const rowsA: ParsedRow[] = [{ jobNumber: 'J1000', customerName: 'Acme', pmInitials: 'AB', line: { description: '', quantity: 1, deliveryOption: '', requiredByDate: '', itemValue: 0, lineTotal: 100, sourceTab: 'Jan25' } }]
    const rowsB: ParsedRow[] = [{ jobNumber: 'J1001', customerName: 'Beta', pmInitials: 'AB', line: { description: '', quantity: 1, deliveryOption: '', requiredByDate: '', itemValue: 0, lineTotal: 200, sourceTab: 'Feb25' } }]

    mockGetSelectedTabs.mockResolvedValue(['List', 'Jan25', 'Feb25'])
    mockGetWorksheetRange
      .mockResolvedValueOnce(SAMPLE_ROWS)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
    mockParseDataTab
      .mockReturnValueOnce(rowsA)
      .mockReturnValueOnce(rowsB)

    await runWorker()

    expect(mockBuildDashboard).toHaveBeenCalledWith(
      [...rowsA, ...rowsB],
      SAMPLE_PM_MAP,
      ['Jan25', 'Feb25'],
    )
  })

  it('saves the dashboard to Redis', async () => {
    await runWorker()
    expect(mockSetDashboard).toHaveBeenCalledWith(SAMPLE_DASHBOARD)
  })

  it('returns the dashboard', async () => {
    const result = await runWorker()
    expect(result).toEqual(SAMPLE_DASHBOARD)
  })

  it('skips a tab that throws and continues with the rest', async () => {
    mockGetSelectedTabs.mockResolvedValue(['List', 'Jan25', 'Feb25'])
    mockGetWorksheetRange
      .mockResolvedValueOnce(SAMPLE_ROWS)           // List — ok
      .mockRejectedValueOnce(new Error('Graph 503')) // Jan25 — fails
      .mockResolvedValueOnce([['header']])            // Feb25 — ok

    await runWorker()

    expect(mockParseDataTab).toHaveBeenCalledTimes(1)
    const [,, processedTab] = mockParseDataTab.mock.calls[0]
    expect(processedTab).toBe('Feb25')
  })

  it('produces an empty dashboard when no data tabs are selected', async () => {
    mockGetSelectedTabs.mockResolvedValue(['List'])
    await runWorker()
    expect(mockParseDataTab).not.toHaveBeenCalled()
    expect(mockBuildDashboard).toHaveBeenCalledWith([], SAMPLE_PM_MAP, [])
  })
})

describe('getDashboardOrRefresh', () => {
  it('returns the cached dashboard without running the worker', async () => {
    mockGetDashboard.mockResolvedValue(SAMPLE_DASHBOARD)
    const result = await getDashboardOrRefresh()
    expect(result).toEqual(SAMPLE_DASHBOARD)
    expect(mockGetWorksheetRange).not.toHaveBeenCalled()
  })

  it('runs the worker when nothing is cached', async () => {
    mockGetDashboard.mockResolvedValue(null)
    const result = await getDashboardOrRefresh()
    expect(result).toEqual(SAMPLE_DASHBOARD)
    expect(mockGetWorksheetRange).toHaveBeenCalledWith('List')
  })
})
