import { NextRequest, NextResponse } from 'next/server'
import { getSelectedTabs, setSelectedTabs } from '@/lib/cache'
import { jsonRoute } from '@/lib/api'

export const GET = jsonRoute('/api/settings GET', async () => ({ tabs: await getSelectedTabs() }))

export const POST = jsonRoute('/api/settings POST', async (req: NextRequest) => {
  const body = await req.json()
  const tabs = body.tabs

  if (!Array.isArray(tabs) || !tabs.every((t: unknown) => typeof t === 'string')) {
    return NextResponse.json({ error: 'tabs must be an array of strings' }, { status: 400 })
  }

  await setSelectedTabs(tabs as string[])
  return { ok: true }
})
