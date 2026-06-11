import { NextRequest, NextResponse } from 'next/server'
import { runWorker } from '@/lib/worker'

// Called by Vercel Cron on a schedule defined in vercel.json.
// Protected by a shared secret so only the cron runner can trigger it.
export async function GET(req: NextRequest) {
  const secret = req.headers.get('x-cron-secret') ?? req.nextUrl.searchParams.get('secret')

  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const dashboard = await runWorker()
    return NextResponse.json({ lastRefreshed: dashboard.lastRefreshed, tabsProcessed: dashboard.tabsProcessed })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[/api/cron]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
