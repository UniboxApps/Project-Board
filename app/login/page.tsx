import { signIn } from '@/auth'

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white rounded-xl shadow-md p-10 flex flex-col items-center gap-6 w-full max-w-sm">
        <h1 className="text-2xl font-semibold text-gray-900">Unibox Project Board</h1>
        <p className="text-sm text-gray-500 text-center">
          Sign in with your Unibox Microsoft account to continue.
        </p>
        <form
          action={async () => {
            'use server'
            await signIn('microsoft-entra-id', { redirectTo: '/' })
          }}
        >
          <button
            type="submit"
            className="flex items-center gap-3 px-5 py-2.5 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 text-sm font-medium text-gray-700 shadow-sm transition-colors"
          >
            <MicrosoftIcon />
            Sign in with Microsoft
          </button>
        </form>
      </div>
    </main>
  )
}

function MicrosoftIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="1" y="1" width="9" height="9" fill="#F25022" />
      <rect x="11" y="1" width="9" height="9" fill="#7FBA00" />
      <rect x="1" y="11" width="9" height="9" fill="#00A4EF" />
      <rect x="11" y="11" width="9" height="9" fill="#FFB900" />
    </svg>
  )
}