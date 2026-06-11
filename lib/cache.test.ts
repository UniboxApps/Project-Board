import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock @upstash/redis before importing cache.ts so the module never tries
// to connect to a real Redis instance during tests.
const mockGet = vi.fn()
const mockSet = vi.fn()

vi.mock('@upstash/redis', () => ({
  Redis: vi.fn().mockImplementation(function () {
    this.get = mockGet
    this.set = mockSet
  }),
}))

// Import after mock is registered
const { getDashboard, setDashboard, getSelectedTabs, setSelectedTabs } = await import(
  '@/lib/cache'
)

import type { CachedDashboard } from '@/lib/types'

const SAMPLE_DASHBOARD: CachedDashboard = {
  boards: [],
  lastRefreshed: '2025-06-01T10:00:00.000Z',
  tabsProcessed: ['Jan25'],
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('getDashboard', () => {
  it('returns the cached dashboard when Redis has data', async () => {
    mockGet.mockResolvedValue(SAMPLE_DASHBOARD)
    const result = await getDashboard()
    expect(result).toEqual(SAMPLE_DASHBOARD)
    expect(mockGet).toHaveBeenCalledWith('dashboard:cache')
  })

  it('returns null when Redis has no cached dashboard', async () => {
    mockGet.mockResolvedValue(null)
    const result = await getDashboard()
    expect(result).toBeNull()
  })
})

describe('setDashboard', () => {
  it('writes the dashboard to the correct Redis key', async () => {
    mockSet.mockResolvedValue('OK')
    await setDashboard(SAMPLE_DASHBOARD)
    expect(mockSet).toHaveBeenCalledWith('dashboard:cache', SAMPLE_DASHBOARD)
  })
})

describe('getSelectedTabs', () => {
  it('returns stored tabs merged with always-read tabs', async () => {
    mockGet.mockResolvedValue(['Jan25', 'Feb25'])
    const result = await getSelectedTabs()
    expect(result).toContain('List')
    expect(result).toContain('Jan25')
    expect(result).toContain('Feb25')
  })

  it('deduplicates if List tab is already in stored tabs', async () => {
    mockGet.mockResolvedValue(['List', 'Jan25'])
    const result = await getSelectedTabs()
    expect(result.filter((t) => t === 'List')).toHaveLength(1)
  })

  it('returns only always-read tabs when nothing is stored', async () => {
    mockGet.mockResolvedValue(null)
    const result = await getSelectedTabs()
    expect(result).toEqual(['List'])
  })

  it('returns only always-read tabs when stored array is empty', async () => {
    mockGet.mockResolvedValue([])
    const result = await getSelectedTabs()
    expect(result).toEqual(['List'])
  })

  it('reads from the correct Redis key', async () => {
    mockGet.mockResolvedValue(null)
    await getSelectedTabs()
    expect(mockGet).toHaveBeenCalledWith('settings:selected-tabs')
  })
})

describe('setSelectedTabs', () => {
  it('writes tabs to the correct Redis key', async () => {
    mockSet.mockResolvedValue('OK')
    await setSelectedTabs(['Jan25', 'Feb25'])
    expect(mockSet).toHaveBeenCalledWith('settings:selected-tabs', ['Jan25', 'Feb25'])
  })

  it('accepts an empty array', async () => {
    mockSet.mockResolvedValue('OK')
    await setSelectedTabs([])
    expect(mockSet).toHaveBeenCalledWith('settings:selected-tabs', [])
  })
})
