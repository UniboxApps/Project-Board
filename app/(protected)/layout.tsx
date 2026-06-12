import { redirect } from 'next/navigation'
import { auth, signOut } from '@/auth'

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()

  if (!session) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
        <span className="font-semibold text-gray-900">Unibox Project Board</span>
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <span>{session.user?.name ?? session.user?.email}</span>
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