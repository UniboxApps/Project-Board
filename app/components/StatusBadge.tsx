type Variant = 'install' | 'overdue' | 'due-soon'

const badges: Record<Variant, { label: string; className: string }> = {
  install:    { label: 'Install',  className: 'bg-purple-100 text-purple-700 border border-purple-200' },
  overdue:    { label: 'Overdue',  className: 'bg-red-100 text-red-700 border border-red-200' },
  'due-soon': { label: 'Due Soon', className: 'bg-amber-100 text-amber-700 border border-amber-200' },
}

export default function StatusBadge({ variant }: { variant: Variant }) {
  const { label, className } = badges[variant]
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${className}`}>
      {label}
    </span>
  )
}
