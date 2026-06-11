import type { PMMap } from '@/lib/types'

type Props = {
  pmMap: PMMap
}

export default function PMList({ pmMap }: Props) {
  const entries = Object.entries(pmMap)

  if (entries.length === 0) {
    return <p className="text-sm text-gray-400 italic">No project managers found in the List tab.</p>
  }

  return (
    <ul className="divide-y divide-gray-100 border border-gray-200 rounded-lg overflow-hidden">
      {entries.map(([initials, name]) => (
        <li key={initials} className="flex items-center gap-4 px-4 py-3 bg-white">
          <span className="w-10 text-sm font-mono font-semibold text-gray-500">{initials}</span>
          <span className="text-sm text-gray-800">{name}</span>
        </li>
      ))}
    </ul>
  )
}