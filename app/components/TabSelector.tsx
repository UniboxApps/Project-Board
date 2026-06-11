'use client'

import { useState, useTransition } from 'react'
import { ALWAYS_READ_TABS } from '@/config/constants'

type Props = {
  allTabs: string[]
  initialSelected: string[]
}

export default function TabSelector({ allTabs, initialSelected }: Props) {
  const [selected, setSelected] = useState<Set<string>>(new Set(initialSelected))
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [refreshMsg, setRefreshMsg] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function toggle(tab: string) {
    if (ALWAYS_READ_TABS.includes(tab)) return
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(tab) ? next.delete(tab) : next.add(tab)
      return next
    })
    setSaved(false)
    setSaveError(null)
  }

  function handleSave() {
    startTransition(async () => {
      setSaved(false)
      setSaveError(null)
      try {
        const res = await fetch('/api/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tabs: Array.from(selected) }),
        })
        if (!res.ok) throw new Error(`Save failed (${res.status})`)
        setSaved(true)
      } catch (err) {
        setSaveError(err instanceof Error ? err.message : 'Save failed')
      }
    })
  }

  function handleRefresh() {
    startTransition(async () => {
      setRefreshMsg(null)
      try {
        const res = await fetch('/api/refresh', { method: 'POST' })
        if (!res.ok) throw new Error(`Refresh failed (${res.status})`)
        const data = await res.json() as { lastRefreshed: string; tabsProcessed: string[] }
        setRefreshMsg(
          `Refreshed at ${new Date(data.lastRefreshed).toLocaleTimeString()} — ${data.tabsProcessed.length} tab(s) processed`,
        )
      } catch (err) {
        setRefreshMsg(err instanceof Error ? err.message : 'Refresh failed')
      }
    })
  }

  return (
    <div className="space-y-4">
      <ul className="divide-y divide-gray-100 border border-gray-200 rounded-lg overflow-hidden">
        {allTabs.map((tab) => {
          const locked = ALWAYS_READ_TABS.includes(tab)
          const checked = locked || selected.has(tab)
          return (
            <li key={tab} className="flex items-center gap-3 px-4 py-3 bg-white">
              <input
                type="checkbox"
                id={`tab-${tab}`}
                checked={checked}
                disabled={locked}
                onChange={() => toggle(tab)}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 disabled:opacity-50"
              />
              <label
                htmlFor={`tab-${tab}`}
                className={`flex-1 text-sm select-none ${
                  locked ? 'text-gray-400' : 'text-gray-800 cursor-pointer'
                }`}
              >
                {tab}
                {locked && (
                  <span className="ml-2 text-xs text-gray-400 italic">
                    Always active — PM source
                  </span>
                )}
              </label>
            </li>
          )
        })}
      </ul>

      <p className="text-xs text-gray-400">Changes take effect on the next data refresh.</p>

      <div className="flex items-center gap-3 flex-wrap">
        <button
          onClick={handleSave}
          disabled={isPending}
          className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {isPending ? 'Saving…' : 'Save'}
        </button>
        <button
          onClick={handleRefresh}
          disabled={isPending}
          className="px-4 py-2 bg-gray-100 text-gray-800 text-sm rounded-md hover:bg-gray-200 disabled:opacity-50 transition-colors"
        >
          {isPending ? 'Refreshing…' : 'Refresh Now'}
        </button>

        {saved && <span className="text-sm text-green-600">Saved</span>}
        {saveError && <span className="text-sm text-red-600">{saveError}</span>}
        {refreshMsg && <span className="text-sm text-gray-600">{refreshMsg}</span>}
      </div>
    </div>
  )
}