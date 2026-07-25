import type { VisitorStatus } from '@/types/database';

export function visitorStatusBadgeTone(
  status: VisitorStatus,
): 'pending' | 'success' | 'danger' | 'muted' {
  if (status === 'pending') return 'pending';
  if (status === 'approved' || status === 'checked_in') return 'success';
  if (status === 'rejected') return 'danger';
  return 'muted';
}

export function visitorStatusLabel(status: VisitorStatus): string {
  if (status === 'checked_in') return 'Inside';
  if (status === 'checked_out') return 'Exited';
  return status;
}
