import { refreshDashboard } from '@/lib/worker'
import { jsonRoute } from '@/lib/api'

export const POST = jsonRoute('/api/refresh', refreshDashboard)
