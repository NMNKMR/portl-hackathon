import { Image } from 'expo-image';
import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';

import { Badge } from '@/components/ui/badge';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import {
  complaintCategoryLabel,
  complaintFlatLabel,
  complaintStatusBadge,
  type Complaint,
} from '@/lib/api/complaints';
import { cn } from '@/lib/cn';
import { formatJoinDate } from '@/lib/format';
import { useThemeColors } from '@/lib/theme-colors';

export type ComplaintCardProps = {
  complaint: Complaint;
  onPress?: () => void;
  /** Optional footer slot (e.g. admin quick actions on list — prefer detail screen). */
  footer?: ReactNode;
  className?: string;
};

export function ComplaintCard({
  complaint,
  onPress,
  footer,
  className,
}: ComplaintCardProps) {
  const colors = useThemeColors();
  const badge = complaintStatusBadge(complaint.status);
  const hasPhoto = Boolean(complaint.photo_url?.trim());

  const body = (
    <View
      className={cn(
        'mb-3 rounded-xl border border-border bg-card px-4 py-3',
        className,
      )}
    >
      <View className="flex-row items-start gap-3">
        {hasPhoto ? (
          <Image
            source={{ uri: complaint.photo_url! }}
            style={{ width: 56, height: 56, borderRadius: 12 }}
            contentFit="cover"
            accessibilityLabel="Complaint photo"
          />
        ) : (
          <View className="h-14 w-14 items-center justify-center rounded-xl bg-primary/10">
            <Icon
              family="ionic"
              name="construct-outline"
              size={24}
              color={colors.primary}
            />
          </View>
        )}

        <View className="min-w-0 flex-1">
          <View className="flex-row items-start justify-between gap-2">
            <View className="min-w-0 flex-1">
              <Text variant="label">
                {complaintCategoryLabel(complaint.category)}
              </Text>
              <Text variant="caption" tone="muted" className="mt-0.5">
                {complaintFlatLabel(complaint)} ·{' '}
                {formatJoinDate(complaint.created_at)}
              </Text>
            </View>
            <View className="flex-row items-center gap-1">
              <Badge tone={badge.tone} label={badge.label} />
              {onPress ? (
                <Icon
                  family="ionic"
                  name="chevron-forward"
                  size={18}
                  color={colors.muted}
                />
              ) : null}
            </View>
          </View>

          {complaint.description ? (
            <Text variant="body" className="mt-2" numberOfLines={2}>
              {complaint.description}
            </Text>
          ) : null}
        </View>
      </View>

      {footer ? <View className="mt-3">{footer}</View> : null}
    </View>
  );

  if (!onPress) return body;

  return (
    <Pressable onPress={onPress} accessibilityRole="button">
      {body}
    </Pressable>
  );
}
