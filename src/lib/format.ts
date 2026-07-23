/** Small display helpers for join / membership UI. */

import type {
  MembershipWithSociety,
  PendingMembership,
} from '@/lib/api/society';
import { membershipFlatLabel, pendingFlatLabel } from '@/lib/api/society';

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

/** e.g. Resident • Owner • Tower A • 1204 */
export function membershipSummaryLine(
  membership: Pick<
    MembershipWithSociety,
    'role' | 'resident_type' | 'member_type' | 'flats'
  >,
): string {
  const parts: string[] = [capitalize(membership.role)];

  if (membership.role === 'resident') {
    if (membership.member_type === 'household') {
      parts.push('Household');
    } else if (membership.resident_type) {
      parts.push(capitalize(membership.resident_type));
    }
  }

  const flatLabel = membershipFlatLabel(membership);
  if (flatLabel && membership.role === 'resident') {
    if (flatLabel.includes(' · ')) {
      parts.push(...flatLabel.split(' · '));
    } else {
      parts.push(flatLabel);
    }
  }

  return parts.join(' • ');
}

/** e.g. Resident • Household • Tower A • 1204 */
export function pendingSummaryLine(item: PendingMembership): string {
  const parts: string[] = [capitalize(item.role)];

  if (item.role === 'resident') {
    if (item.member_type === 'household') {
      parts.push('Household');
    } else if (item.resident_type) {
      parts.push(capitalize(item.resident_type));
    }
  }

  const flatLabel = pendingFlatLabel(item);
  if (flatLabel && item.role === 'resident') {
    if (flatLabel.includes(' · ')) {
      parts.push(...flatLabel.split(' · '));
    } else {
      parts.push(flatLabel);
    }
  }

  return parts.join(' • ');
}

export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export function formatJoinDate(iso: string | null | undefined): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function displayPersonName(
  fullName: string | null | undefined,
  fallback = 'Unnamed member',
): string {
  const trimmed = fullName?.trim();
  return trimmed ? trimmed : fallback;
}
