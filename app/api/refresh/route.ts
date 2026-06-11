import { NextResponse } from 'next/server'
import { runWorker } from '@/lib/worker'

export async function POST() {
  try {
    const dashboard = await runWorker()
    return NextResponse.json({ lastRefreshed: dashboard.lastRefreshed, tabsProcessed: dashboard.tabsProcessed })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[/api/refresh]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}