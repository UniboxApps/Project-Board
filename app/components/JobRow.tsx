'use client'

import type { JobDateGroup } from '@/lib/types'
import { getRowStatus, formatGBP, formatDate } from '@/lib/formatting'
import StatusBadges from '@/app/components/StatusBadges'

type Props = {
  row: JobDateGroup
  onSelect: (row: JobDateGroup) => void
}

const rowBg: Record<string, string> = {
  overdue:   'bg-red-50 hover:bg-red-100',
  'due-soon':'bg-amber-50 hover:bg-amber-100',
  normal:    'hover:bg-gray-50',
}

export default function JobRow({ row, onSelect }: Props) {
  const status = getRowStatus(row.requiredByDate)

  return (
    <tr
      className={`cursor-pointer transition-colors ${rowBg[status]}`}
      onClick={() => onSelect(row)}
    >
      <td className="px-4 py-2.5 text-sm font-medium text-gray-900 whitespace-nowrap">
        {row.jobNumber}
      </td>
      <td className="px-4 py-2.5 text-sm text-gray-700 max-w-[200px] truncate">
        {row.customerName}
      </td>
      <td className="px-4 py-2.5 text-sm text-gray-700 text-right whitespace-nowrap">
        {formatGBP(row.totalValue)}
      </td>
      <td className="px-4 py-2.5 text-sm whitespace-nowrap">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className={status === 'overdue' ? 'font-semibold text-red-700' : 'text-gray-700'}>
            {formatDate(row.requiredByDate)}
          </span>
          <StatusBadges status={status} hasInstall={row.hasInstall} />
        </div>
      </td>
    </tr>
  )
}

