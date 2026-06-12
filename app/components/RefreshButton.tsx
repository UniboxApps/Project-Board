'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { formatLastRefreshed } from '@/lib/formatting'

export default function RefreshButton({ lastRefreshed }: { lastRefreshed: string | null }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleRefresh() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/refresh', { method: 'POST' })
      if (!res.ok) throw new Error(`Refresh failed (${res.status})`)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Refresh failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-3">
      {error && <span className="text-red-600">{error}</span>}
      {lastRefreshed && (
        <span className="text-gray-500" suppressHydrationWarning>
          Last synced: {formatLastRefreshed(lastRefreshed)}
        </span>
      )}
      <button
        onClick={handleRefresh}
        disabled={loading}
        className="px-3 py-1.5 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? 'Refreshing…' : 'Refresh'}
      </button>
    </div>
  )
}
