'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ALWAYS_READ_TABS } from '@/config/constants'

type Props = {
  allTabs: string[]
  initialSelected: string[]
}

export default function TabSelector({ allTabs, initialSelected }: Props) {
  const router = useRouter()
  const [selected, setSelected] = useState<Set<string>>(new Set(initialSelected))
  const [status, setStatus] = useState<'idle' | 'saving' | 'refreshing' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function toggle(tab: string) {
    if (ALWAYS_READ_TABS.includes(tab)) return
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(tab) ? next.delete(tab) : next.add(tab)
      return next
    })
    setStatus('idle')
    setErrorMsg(null)
  }

  function handleSave() {
    startTransition(async () => {
      setErrorMsg(null)

      // Step 1: save tab selection
      setStatus('saving')
      try {
        const res = await fetch('/api/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tabs: Array.from(selected) }),
        })
        if (!res.ok) throw new Error(`Save failed (${res.status})`)
      } catch (err) {
        setStatus('error')
        setErrorMsg(err instanceof Error ? err.message : 'Save failed')
        return
      }

      // Step 2: refresh data with the new tab selection
      setStatus('refreshing')
      try {
        const res = await fetch('/api/refresh', { method: 'POST' })
        if (!res.ok) throw new Error(`Refresh failed (${res.status})`)
      } catch (err) {
        setStatus('error')
        setErrorMsg(err instanceof Error ? err.message : 'Refresh failed')
        return
      }

      // Step 3: redirect to the dashboard
      router.push('/')
    })
  }

  const busy = isPending || status === 'saving' || status === 'refreshing'

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
                disabled={locked || busy}
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

      <div className="flex items-center gap-3 flex-wrap">
        <button
          onClick={handleSave}
          disabled={busy}
          className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {status === 'saving'     ? 'Saving…'
           : status === 'refreshing' ? 'Refreshing…'
           : 'Save'}
        </button>

        {errorMsg && <span className="text-sm text-red-600">{errorMsg}</span>}
      </div>
    </div>
  )
}
