'use client'

import { useState } from 'react'
import type { PMBoard, JobDateGroup } from '@/lib/types'
import JobRow from '@/app/components/JobRow'

export default function PMBoardCard({ board }: { board: PMBoard }) {
  const [selectedRow, setSelectedRow] = useState<JobDateGroup | null>(null)

  return (
    <>
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        {/* Card header */}
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">{board.projectManager}</h2>
          <p className="mt-0.5 text-sm text-gray-500">
            {board.totalProjects} {board.totalProjects === 1 ? 'project' : 'projects'}
            <span className="mx-1.5 text-gray-300">·</span>
            Total: {formatGBP(board.totalValue)}
          </p>
        </div>

        {/* Table */}
        {board.tableRows.length === 0 ? (
          <p className="px-5 py-4 text-sm text-gray-400">No active jobs.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide whitespace-nowrap">Job No</th>
                  <th className="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">Customer</th>
                  <th className="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide text-right whitespace-nowrap">Value</th>
                  <th className="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide whitespace-nowrap">Due Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {board.tableRows.map((row, i) => (
                  <JobRow key={`${row.jobNumber}-${row.requiredByDate}-${i}`} row={row} onSelect={setSelectedRow} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Stage 12: JobDetailCard rendered here when selectedRow is set */}
      {selectedRow && (
        <div className="hidden" aria-hidden>
          {/* placeholder — wired up in Stage 12 */}
        </div>
      )}
    </>
  )
}

function formatGBP(value: number): string {
  return '£' + value.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
