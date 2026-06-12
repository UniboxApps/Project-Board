export type RowStatus = 'overdue' | 'due-soon' | 'normal'

export function getRowStatus(requiredByDate: string): RowStatus {
  if (!requiredByDate) return 'normal'

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const due = new Date(requiredByDate)
  due.setHours(0, 0, 0, 0)

  const daysUntil = Math.round((due.getTime() - today.getTime()) / 86400000)

  if (daysUntil < 0) return 'overdue'
  if (daysUntil <= 1) return 'due-soon'
  return 'normal'
}

export function formatLastRefreshed(isoString: string): string {
  const diffMins = Math.floor((Date.now() - new Date(isoString).getTime()) / 60000)
  if (diffMins < 1) return 'Just now'
  if (diffMins === 1) return '1 min ago'
  return `${diffMins} mins ago`
}

export function formatGBP(value: number): string {
  return '£' + value.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export function formatDate(iso: string): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}
