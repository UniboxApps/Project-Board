import { Suspense } from 'react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth, signOut } from '@/auth'
import HeaderTimestamp from '@/app/components/HeaderTimestamp'
import AutoRefresh from '@/app/components/AutoRefresh'

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()

  if (!session) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-4 py-3">
        {/* Primary row — always visible */}
        <div className="flex items-center gap-4">
          {/* Brand */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xl font-bold tracking-tight text-gray-900">Unibox</span>
            <span className="text-sm font-medium text-gray-400">x</span>
            <span className="text-sm font-medium text-gray-400">Project Board</span>
          </div>

          {/* Nav — hidden on mobile */}
          <nav className="hidden md:flex flex-1 justify-center">
            <Link
              href="/settings"
              className="text-sm text-gray-600 hover:text-gray-900 px-3 py-1 rounded hover:bg-gray-100 transition-colors"
            >
              Settings
            </Link>
          </nav>

          {/* Right cluster */}
          <div className="flex items-center gap-4 text-sm shrink-0 ml-auto">
            {/* Timestamp + refresh — hidden on mobile */}
            <div className="hidden md:flex items-center">
              <Suspense fallback={<span className="text-sm text-gray-400">Loading…</span>}>
                <HeaderTimestamp />
              </Suspense>
            </div>
            <span className="hidden md:block text-gray-300">|</span>
            <span className="hidden md:block text-gray-600">{session.user?.name ?? session.user?.email}</span>
            <form
              action={async () => {
                'use server'
                await signOut({ redirectTo: '/login' })
              }}
            >
              <button type="submit" className="text-gray-500 hover:text-gray-800 transition-colors text-sm">
                Sign out
              </button>
            </form>
          </div>
        </div>

        {/* Secondary row — mobile only */}
        <div className="flex md:hidden items-center justify-between mt-2 pt-2 border-t border-gray-100">
          <Suspense fallback={<span className="text-sm text-gray-400">Loading…</span>}>
            <HeaderTimestamp />
          </Suspense>
          <nav>
            <Link
              href="/settings"
              className="text-sm text-gray-600 hover:text-gray-900 px-3 py-1 rounded hover:bg-gray-100 transition-colors"
            >
              Settings
            </Link>
          </nav>
        </div>
      </header>

      {children}
      <AutoRefresh />
    </div>
  )
}
