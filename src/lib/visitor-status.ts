import type { VisitorStatus } from '@/types/database';

export function capitalizeVisitorValue(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1).replace(/_/g, ' ');
}

export function visitorStatusBadgeTone(
  status: VisitorStatus,
): 'pending' | 'success' | 'danger' | 'muted' {
  if (status === 'pending') return 'pending';
  if (status === 'approved' || status === 'checked_in') return 'success';
  if (status === 'rejected') return 'danger';
  return 'muted';
}

export function visitorStatusLabel(status: VisitorStatus): string {
  if (status === 'pending') return 'Pending';
  if (status === 'approved') return 'Approved';
  if (status === 'rejected') return 'Rejected';
  if (status === 'checked_in') return 'Inside';
  if (status === 'checked_out') return 'Exited';
  return capitalizeVisitorValue(status);
}
