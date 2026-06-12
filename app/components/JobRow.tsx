'use client'

import type { JobDateGroup } from '@/lib/types'
import { getRowStatus, formatGBP, formatDate } from '@/lib/formatting'
import StatusBadge from '@/app/components/StatusBadge'

type Props = {
  row: JobDateGroup
  onSelect: (row: JobDateGroup) => void
}

function rowClass(status: ReturnType<typeof getRowStatus>, hasInstall: boolean): string {
  if (status === 'overdue')   return 'bg-red-50 hover:bg-red-100 cursor-pointer transition-colors'
  if (status === 'due-soon')  return 'bg-amber-50 hover:bg-amber-100 cursor-pointer transition-colors'
  if (hasInstall)             return 'bg-yellow-50 hover:bg-yellow-100 cursor-pointer transition-colors'
  return 'hover:bg-gray-50 cursor-pointer transition-colors'
}

export default function JobRow({ row, onSelect }: Props) {
  const status = getRowStatus(row.requiredByDate)

  return (
    <tr className={rowClass(status, row.hasInstall)} onClick={() => onSelect(row)}>
      <td className="px-4 py-1.5 text-sm font-medium text-gray-900 whitespace-nowrap">
        <div className="flex items-center gap-1.5">
          {row.jobNumber}
          {row.hasInstall && <StatusBadge variant="install" />}
          {status === 'overdue' && <StatusBadge variant="overdue" />}
        </div>
      </td>
      <td className="px-4 py-1.5 text-sm text-gray-700 max-w-[200px] truncate">
        {row.customerName}
      </td>
      <td className="px-4 py-1.5 text-sm text-gray-700 text-right whitespace-nowrap">
        {formatGBP(row.totalValue)}
      </td>
      <td className="px-4 py-1.5 text-sm whitespace-nowrap">
        <div className="flex items-center gap-1.5">
          <span className={status === 'overdue' ? 'font-semibold text-red-700' : 'text-gray-700'}>
            {formatDate(row.requiredByDate)}
          </span>
          {status === 'due-soon' && <StatusBadge variant="due-soon" />}
        </div>
      </td>
    </tr>
  )
}
