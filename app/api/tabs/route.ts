import { NextResponse } from 'next/server'
import { listWorksheets } from '@/lib/graph'

export async function GET() {
  try {
    const tabs = await listWorksheets()
    return NextResponse.json({ tabs })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[/api/tabs]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}