'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

const NINE_MINUTES_MS = 9 * 60 * 1000

export default function AutoRefresh() {
  const router = useRouter()

  useEffect(() => {
    const id = setInterval(() => router.refresh(), NINE_MINUTES_MS)
    return () => clearInterval(id)
  }, [router])

  return null
}
