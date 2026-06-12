import { auth } from '@/auth'
import { NextResponse } from 'next/server'

export default auth((req) => {
  if (!req.auth) {
    const loginUrl = new URL('/login', req.nextUrl.origin)
    return NextResponse.redirect(loginUrl)
  }
})

export const config = {
  matcher: [
    // Protect everything except auth routes, login, and Next.js internals
    '/((?!api/auth|api/cron|login|_next/static|_next/image|favicon.ico).*)',
  ],
}