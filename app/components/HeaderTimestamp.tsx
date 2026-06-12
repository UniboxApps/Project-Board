import { getDashboard } from '@/lib/cache'
import RefreshButton from '@/app/components/RefreshButton'

export default async function HeaderTimestamp() {
  const dashboard = await getDashboard()
  return <RefreshButton lastRefreshed={dashboard?.lastRefreshed ?? null} />
}
