import type { VisitorRequest } from '@/lib/api/visitors';

export type VisitorDateRange = 'today' | 'week' | 'month' | 'all';

export const VISITOR_DATE_FILTERS: { id: VisitorDateRange; label: string }[] = [
  { id: 'today', label: 'Today' },
  { id: 'week', label: '7 days' },
  { id: 'month', label: '30 days' },
  { id: 'all', label: 'All' },
];

export function filterVisitorsByDate(
  visitors: VisitorRequest[],
  range: VisitorDateRange,
): VisitorRequest[] {
  if (range === 'all') return visitors;

  const now = new Date();
  const start = new Date(now);

  if (range === 'today') {
    start.setHours(0, 0, 0, 0);
  } else if (range === 'week') {
    start.setDate(start.getDate() - 7);
    start.setHours(0, 0, 0, 0);
  } else if (range === 'month') {
    start.setDate(start.getDate() - 30);
    start.setHours(0, 0, 0, 0);
  }

  return visitors.filter((visitor) => {
    const date = new Date(visitor.requested_at);
    return !Number.isNaN(date.getTime()) && date >= start;
  });
}

export type PreApprovalFilter = 'active' | 'all' | 'exhausted';

export const PRE_APPROVAL_FILTERS: { id: PreApprovalFilter; label: string }[] = [
  { id: 'active', label: 'Active' },
  { id: 'all', label: 'All' },
  { id: 'exhausted', label: 'Used up' },
];

export function filterPreApprovals(
  visitors: VisitorRequest[],
  filter: PreApprovalFilter,
  isActive: (v: VisitorRequest) => boolean,
  isExhausted: (v: VisitorRequest) => boolean,
): VisitorRequest[] {
  if (filter === 'active') return visitors.filter(isActive);
  if (filter === 'exhausted') return visitors.filter(isExhausted);
  return visitors;
}
