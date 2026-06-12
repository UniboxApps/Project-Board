'use client'

import { useState } from 'react'
import type { PMBoard, JobDateGroup } from '@/lib/types'
import JobRow from '@/app/components/JobRow'
import JobDetailCard from '@/app/components/JobDetailCard'
import { formatGBP } from '@/lib/formatting'

export default function PMBoardCard({ board }: { board: PMBoard }) {
  const [selectedRow, setSelectedRow] = useState<JobDateGroup | null>(null)

  return (
    <>
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        {/* Card header */}
        <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between gap-4">
          <h2 className="text-sm font-semibold text-gray-900 shrink-0">
            {board.projectManager}{' '}
            <span className="font-normal text-gray-400">({board.pmInitials})</span>
          </h2>
          <p className="text-sm text-gray-500 text-right whitespace-nowrap">
            {board.totalProjects} {board.totalProjects === 1 ? 'project' : 'projects'}
            <span className="mx-1.5 text-gray-300">·</span>
            {formatGBP(board.totalValue)}
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

      {selectedRow && (
        <JobDetailCard
          row={selectedRow}
          board={board}
          onClose={() => setSelectedRow(null)}
        />
      )}
    </>
  )
}

