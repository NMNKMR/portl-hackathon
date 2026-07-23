import { Pressable, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import type { PendingMembership } from '@/lib/api/society';
import {
  displayPersonName,
  formatJoinDate,
  pendingSummaryLine,
} from '@/lib/format';
import { formatPhoneDisplay } from '@/lib/phone';
import { useThemeColors } from '@/lib/theme-colors';

export type PendingJoinCardProps = {
  item: PendingMembership;
  selectMode?: boolean;
  selected?: boolean;
  onToggleSelect?: () => void;
  onApprove: () => void;
  onReject: () => void;
  isApproving?: boolean;
  isRejecting?: boolean;
  compact?: boolean;
};

export function PendingJoinCard({
  item,
  selectMode = false,
  selected = false,
  onToggleSelect,
  onApprove,
  onReject,
  isApproving = false,
  isRejecting = false,
  compact = false,
}: PendingJoinCardProps) {
  const colors = useThemeColors();
  const summary = pendingSummaryLine(item);
  const requestedAt = formatJoinDate(item.created_at);

  return (
    <View className="mb-3 rounded-xl border border-border bg-card px-4 py-3">
      <View className="flex-row items-start gap-3">
        {selectMode ? (
          <Pressable
            onPress={onToggleSelect}
            hitSlop={8}
            className="pt-0.5"
            accessibilityRole="checkbox"
            accessibilityState={{ checked: selected }}
          >
            <Icon
              family="ionic"
              name={selected ? 'checkbox' : 'square-outline'}
              size={22}
              color={selected ? colors.roleAdmin : colors.muted}
            />
          </Pressable>
        ) : null}

        <View className="flex-1">
          <View className="flex-row items-start justify-between gap-2">
            <View className="flex-1">
              <Text variant="label">{displayPersonName(item.full_name)}</Text>
              <Text variant="caption" tone="muted" className="mt-0.5">
                {formatPhoneDisplay(item.phone)}
              </Text>
            </View>
            <Badge tone="pending" label="Pending" />
          </View>

          <Text variant="caption" className="mt-2">
            {summary}
          </Text>
          {requestedAt ? (
            <Text variant="caption" tone="muted" className="mt-1">
              Requested {requestedAt}
            </Text>
          ) : null}

          <View className="mt-3 flex-row gap-2">
            <Button
              style={{ flex: 1 }}
              variant="accent"
              size={compact ? 'sm' : 'md'}
              label="Approve"
              loading={isApproving}
              disabled={isRejecting}
              onPress={onApprove}
            />
            <Button
              style={{ flex: 1 }}
              variant="outlineDanger"
              size={compact ? 'sm' : 'md'}
              label="Reject"
              loading={isRejecting}
              disabled={isApproving}
              onPress={onReject}
            />
          </View>
        </View>
      </View>
    </View>
  );
}
