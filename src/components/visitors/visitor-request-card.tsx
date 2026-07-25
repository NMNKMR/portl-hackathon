import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';

import { Badge } from '@/components/ui/badge';
import { Text } from '@/components/ui/text';
import {
  hasQrPass,
  visitorFlatLabel,
  type VisitorRequest,
} from '@/lib/api/visitors';
import { formatJoinDate } from '@/lib/format';
import { cn } from '@/lib/cn';
import { remainingScans } from '@/lib/visitor-qr';
import type { VisitorStatus } from '@/types/database';

type BadgeTone = 'pending' | 'success' | 'danger' | 'muted';

const STATUS_BADGE: Record<
  VisitorStatus,
  { tone: BadgeTone; label: string }
> = {
  pending: { tone: 'pending', label: 'Pending' },
  approved: { tone: 'success', label: 'Approved' },
  rejected: { tone: 'danger', label: 'Rejected' },
  checked_in: { tone: 'success', label: 'Checked in' },
  checked_out: { tone: 'muted', label: 'Checked out' },
};

function formatVisitorType(type: string): string {
  return type.charAt(0).toUpperCase() + type.slice(1);
}

export type VisitorRequestCardProps = {
  visitor: VisitorRequest;
  onPress?: () => void;
  /** Optional trailing actions (approve, check-in, etc.) */
  trailing?: ReactNode;
  className?: string;
};

export function VisitorRequestCard({
  visitor,
  onPress,
  trailing,
  className,
}: VisitorRequestCardProps) {
  const status = STATUS_BADGE[visitor.status];
  const requestedAt = formatJoinDate(visitor.requested_at);
  const flatLabel = visitorFlatLabel(visitor);

  const body = (
    <View className={cn('mb-3 rounded-xl border border-border bg-card px-4 py-3', className)}>
      <View className="flex-row items-start gap-3">
        <View className="flex-1">
          <View className="flex-row items-start justify-between gap-2">
            <View className="flex-1">
              <Text variant="label">{visitor.visitor_name.trim() || 'Visitor'}</Text>
              <Text variant="caption" tone="muted" className="mt-0.5">
                {formatVisitorType(visitor.visitor_type)} · {flatLabel}
              </Text>
            </View>
            <View className="items-end gap-1">
              <Badge tone={status.tone} label={status.label} />
              {hasQrPass(visitor) ? (
                <Badge tone="pending" label="QR available" />
              ) : null}
            </View>
          </View>

          {visitor.initiated_by === 'resident' && visitor.max_scans > 1 ? (
            <Text variant="caption" tone="muted" className="mt-2">
              Entries {visitor.scan_count}/{visitor.max_scans}
              {remainingScans(visitor) === 0 ? ' · exhausted' : ''}
            </Text>
          ) : null}

          {requestedAt ? (
            <Text variant="caption" tone="muted" className="mt-2">
              {visitor.initiated_by === 'resident' ? 'Pre-approved' : 'Requested'}{' '}
              {requestedAt}
            </Text>
          ) : null}
        </View>

        {trailing ? <View className="pt-0.5">{trailing}</View> : null}
      </View>
    </View>
  );

  if (!onPress) return body;

  return (
    <Pressable onPress={onPress} accessibilityRole="button">
      {body}
    </Pressable>
  );
}
