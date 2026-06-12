import { getDashboardOrRefresh } from '@/lib/worker'
import { jsonRoute } from '@/lib/api'

export const GET = jsonRoute('/api/jobs', getDashboardOrRefresh)
