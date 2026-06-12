import { getDashboardOrRefresh } from '@/lib/worker'
import PMBoardCard from '@/app/components/PMBoard'

export default async function DashboardPage() {
  const dashboard = await getDashboardOrRefresh()

  return (
    <main className="px-6 py-6">
      {dashboard.boards.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white px-6 py-10 text-center">
          <p className="text-sm text-gray-500">
            No data yet. Go to{' '}
            <a href="/settings" className="text-blue-600 hover:underline">Settings</a>{' '}
            to select tabs, then click Refresh.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {dashboard.boards.map((board) => (
            <PMBoardCard key={board.pmInitials} board={board} />
          ))}
        </div>
      )}
    </main>
  )
}
