// Stage 10: Manually triggers worker pipeline
import { NextResponse } from 'next/server'

export function POST() {
  return NextResponse.json({ message: 'not implemented' }, { status: 501 })
}