'use client'

import { useEffect } from 'react'
import type { JobDateGroup, PMBoard } from '@/lib/types'
import { getRowStatus } from '@/lib/formatting'
import StatusBadge from '@/app/components/StatusBadge'

type Props = {
  row: JobDateGroup
  board: Pick<PMBoard, 'projectManager'>
  onClose: () => void
}

export default function JobDetailCard({ row, board, onClose }: Props) {
  const status = getRowStatus(row.requiredByDate)

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const groupTotal = row.productLines.reduce((sum, l) => sum + l.lineTotal, 0)

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Semi-transparent overlay — tables remain visible behind */}
      <div className="absolute inset-0 bg-black/40" />

      {/* Card */}
      <div
        className="relative z-10 w-full max-w-2xl bg-white rounded-lg shadow-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`px-5 py-4 border-b ${headerBg[status]}`}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold text-gray-900">
                Job {row.jobNumber} · {row.customerName}
              </h2>
              <p className="mt-0.5 text-sm text-gray-600">
                Project Manager: {board.projectManager}
              </p>
              <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                <span className="text-sm text-gray-700">Due: {formatDate(row.requiredByDate)}</span>
                {row.hasInstall && <StatusBadge variant="install" />}
                {status === 'overdue' && <StatusBadge variant="overdue" />}
                {status === 'due-soon' && <StatusBadge variant="due-soon" />}
              </div>
            </div>
            <button
              onClick={onClose}
              className="shrink-0 text-gray-400 hover:text-gray-700 transition-colors text-xl leading-none"
              aria-label="Close"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Product lines table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">Description</th>
                <th className="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide text-right whitespace-nowrap">Qty</th>
                <th className="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide text-right whitespace-nowrap">Item £</th>
                <th className="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide text-right whitespace-nowrap">Total £</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {row.productLines.map((line, i) => (
                <tr key={i} className="text-sm">
                  <td className="px-4 py-2.5 text-gray-800">{line.description || '—'}</td>
                  <td className="px-4 py-2.5 text-gray-700 text-right">{line.quantity}</td>
                  <td className="px-4 py-2.5 text-gray-700 text-right">{formatGBP(line.itemValue)}</td>
                  <td className="px-4 py-2.5 text-gray-700 text-right">{formatGBP(line.lineTotal)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-gray-200 bg-gray-50">
                <td colSpan={3} className="px-4 py-2.5 text-sm font-medium text-gray-700 text-right">
                  Group Total
                </td>
                <td className="px-4 py-2.5 text-sm font-semibold text-gray-900 text-right">
                  {formatGBP(groupTotal)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  )
}

const headerBg: Record<string, string> = {
  overdue:   'bg-red-50',
  'due-soon':'bg-amber-50',
  normal:    'bg-white',
}

function formatGBP(value: number): string {
  return '£' + value.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function formatDate(iso: string): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}
