import { unstable_noStore as noStore } from 'next/cache'
import { Redis } from '@upstash/redis'
import type { CachedDashboard } from '@/lib/types'
import { REDIS_KEYS, ALWAYS_READ_TABS } from '@/config/constants'

// Lazy singleton — created once per process, reused across requests.
// Upstash Redis uses HTTP so there is no persistent connection to manage.
let _redis: Redis | null = null

function getRedis(): Redis {
  if (!_redis) {
    _redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  }
  return _redis
}

// --- Dashboard cache ---

export async function getDashboard(): Promise<CachedDashboard | null> {
  noStore()
  const raw = await getRedis().get<CachedDashboard>(REDIS_KEYS.dashboard)
  return raw ?? null
}

export async function setDashboard(dashboard: CachedDashboard): Promise<void> {
  await getRedis().set(REDIS_KEYS.dashboard, dashboard)
}

// --- Tab config ---

// Returns the user-selected tabs merged with ALWAYS_READ_TABS.
// Falls back to ALWAYS_READ_TABS only if nothing has been saved yet.
export async function getSelectedTabs(): Promise<string[]> {
  const stored = await getRedis().get<string[]>(REDIS_KEYS.tabConfig)
  if (!stored || stored.length === 0) return [...ALWAYS_READ_TABS]

  // Ensure always-read tabs are always present even if missing from stored value
  return Array.from(new Set([...ALWAYS_READ_TABS, ...stored]))
}

// Persists the selected tabs. ALWAYS_READ_TABS are added automatically on read,
// so callers may pass them or omit them — either way is safe.
export async function setSelectedTabs(tabs: string[]): Promise<void> {
  await getRedis().set(REDIS_KEYS.tabConfig, tabs)
}