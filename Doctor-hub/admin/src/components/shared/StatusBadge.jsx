import { Badge } from '@/components/ui/badge'

const STATUS_MAP = {
  payment_pending: { label: 'Payment pending', variant: 'warning' },
  payment_submitted: { label: 'Payment submitted', variant: 'secondary' },
  verified: { label: 'Verified', variant: 'default' },
  confirmed: { label: 'Confirmed', variant: 'success' },
  rejected: { label: 'Rejected', variant: 'destructive' },
  completed: { label: 'Completed', variant: 'success' },
  cancelled: { label: 'Cancelled', variant: 'outline' },
  // Legacy CareLink
  payment: { label: 'Paid', variant: 'success' },
  unpaid: { label: 'Unpaid', variant: 'warning' },
}

export function StatusBadge({ status, className }) {
  const config = STATUS_MAP[status] || { label: status, variant: 'outline' }
  return (
    <Badge variant={config.variant} className={className}>
      {config.label}
    </Badge>
  )
}
