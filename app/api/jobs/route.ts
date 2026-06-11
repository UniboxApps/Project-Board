import { NextResponse } from 'next/server'
import { getDashboardOrRefresh } from '@/lib/worker'

export async function GET() {
  try {
    const dashboard = await getDashboardOrRefresh()
    return NextResponse.json(dashboard)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[/api/jobs]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}