type Variant = 'install' | 'overdue' | 'due-soon'

const styles: Record<Variant, string> = {
  install:   'bg-purple-100 text-purple-700 border border-purple-200',
  overdue:   'bg-red-100 text-red-700 border border-red-200',
  'due-soon':'bg-amber-100 text-amber-700 border border-amber-200',
}

const labels: Record<Variant, string> = {
  install:   'Install',
  overdue:   'Overdue',
  'due-soon':'Due Soon',
}

export default function StatusBadge({ variant }: { variant: Variant }) {
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${styles[variant]}`}>
      {labels[variant]}
    </span>
  )
}
