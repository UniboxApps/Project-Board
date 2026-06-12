import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth, signOut } from '@/auth'
import { getDashboard } from '@/lib/cache'
import RefreshButton from '@/app/components/RefreshButton'

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()

  if (!session) {
    redirect('/login')
  }

  const dashboard = await getDashboard()

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-6">
        {/* Brand */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xl font-bold tracking-tight text-gray-900">Unibox</span>
          <span className="text-sm font-medium text-gray-400">Project Board</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 flex justify-center">
          <Link
            href="/settings"
            className="text-sm text-gray-600 hover:text-gray-900 px-3 py-1 rounded hover:bg-gray-100 transition-colors"
          >
            Settings
          </Link>
        </nav>

        {/* Right: refresh + user + sign out */}
        <div className="flex items-center gap-4 text-sm shrink-0">
          <RefreshButton lastRefreshed={dashboard?.lastRefreshed ?? null} />
          <span className="text-gray-300">|</span>
          <span className="text-gray-600">{session.user?.name ?? session.user?.email}</span>
          <form
            action={async () => {
              'use server'
              await signOut({ redirectTo: '/login' })
            }}
          >
            <button type="submit" className="text-gray-500 hover:text-gray-800 transition-colors">
              Sign out
            </button>
          </form>
        </div>
      </header>
      {children}
    </div>
  )
}
