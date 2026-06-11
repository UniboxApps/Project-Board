// Stage 3 test route — remove or protect before production
import { NextResponse } from 'next/server'
import { listWorksheets, getWorksheetRange } from '@/lib/graph'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const sheet = searchParams.get('sheet')

  try {
    if (sheet) {
      const rows = await getWorksheetRange(sheet)
      console.log(`[test-graph] "${sheet}" — ${rows.length} rows, first row:`, rows[0])
      return NextResponse.json({ sheet, rowCount: rows.length, firstRow: rows[0], lastRow: rows.at(-1) })
    }

    const tabs = await listWorksheets()
    console.log('[test-graph] worksheets:', tabs)
    return NextResponse.json({ tabs })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[test-graph]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}