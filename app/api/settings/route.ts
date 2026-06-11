import { NextRequest, NextResponse } from 'next/server'
import { getSelectedTabs, setSelectedTabs } from '@/lib/cache'

export async function GET() {
  try {
    const tabs = await getSelectedTabs()
    return NextResponse.json({ tabs })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[/api/settings GET]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    if (!Array.isArray(body.tabs) || !body.tabs.every((t: unknown) => typeof t === 'string')) {
      return NextResponse.json({ error: 'tabs must be an array of strings' }, { status: 400 })
    }
    await setSelectedTabs(body.tabs as string[])
    return NextResponse.json({ ok: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[/api/settings POST]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}