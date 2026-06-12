'use client'

import { useEffect } from 'react'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[dashboard]', error)
  }, [error])

  return (
    <main className="px-6 py-6">
      <div className="rounded-lg border border-red-200 bg-red-50 px-6 py-10 text-center">
        <p className="text-sm font-medium text-red-800">Could not load the dashboard</p>
        <p className="mt-1 text-xs text-red-600">
          {error.digest ? `Error ID: ${error.digest}` : error.message}
        </p>
        <button
          onClick={reset}
          className="mt-4 px-4 py-2 bg-white border border-red-300 rounded-md text-sm text-red-700 hover:bg-red-50 transition-colors"
        >
          Try again
        </button>
      </div>
    </main>
  )
}
