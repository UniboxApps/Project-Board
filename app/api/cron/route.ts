import { NextRequest, NextResponse } from 'next/server'
import { refreshDashboard } from '@/lib/worker'
import { jsonRoute } from '@/lib/api'

const runRefresh = jsonRoute('/api/cron', refreshDashboard)

// Called by Vercel Cron on a schedule defined in vercel.json.
// Protected by a shared secret so only the cron runner can trigger it.
export async function GET(req: NextRequest): Promise<NextResponse> {
  const authHeader = req.headers.get('authorization')
  const secret = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : req.nextUrl.searchParams.get('secret')

  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return runRefresh()
}
