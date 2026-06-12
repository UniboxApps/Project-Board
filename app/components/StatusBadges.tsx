import type { RowStatus } from '@/lib/formatting'
import StatusBadge from '@/app/components/StatusBadge'

type Props = {
  status: RowStatus
  hasInstall: boolean
}

// The Install / Overdue / Due Soon badge trio shared by JobRow and JobDetailCard.
export default function StatusBadges({ status, hasInstall }: Props) {
  return (
    <>
      {hasInstall && <StatusBadge variant="install" />}
      {status === 'overdue' && <StatusBadge variant="overdue" />}
      {status === 'due-soon' && <StatusBadge variant="due-soon" />}
    </>
  )
}
