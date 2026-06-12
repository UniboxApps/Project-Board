import { listWorksheets } from '@/lib/graph'
import { jsonRoute } from '@/lib/api'

export const GET = jsonRoute('/api/tabs', async () => ({ tabs: await listWorksheets() }))
