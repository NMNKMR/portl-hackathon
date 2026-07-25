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
import { formatVisitorListTimestamp } from '@/lib/format';
import { useThemeColors } from '@/lib/theme-colors';

const TAG_CLASS = 'px-1.5 py-0';
const TAG_LABEL_CLASS = 'text-[10px] leading-3';

export type ComplaintCardProps = {
  complaint: Complaint;
  onPress?: () => void;
  footer?: ReactNode;
  className?: string;
  hideFlat?: boolean;
};

export function ComplaintCard({
  complaint,
  onPress,
  footer,
  className,
  hideFlat = false,
}: ComplaintCardProps) {
  const colors = useThemeColors();
  const badge = complaintStatusBadge(complaint.status);
  const categoryLabel = complaintCategoryLabel(complaint.category);
  const flatLabel = complaintFlatLabel(complaint);
  const timestamp = formatVisitorListTimestamp(complaint.created_at);
  const hasPhoto = Boolean(complaint.photo_url?.trim());
  const excerpt = complaint.description?.trim() || 'No description';

  const body = (
    <View
      className={cn(
        'mb-3 rounded-2xl border border-border bg-card p-3',
        className,
      )}
    >
      <View className="flex-row items-start gap-3">
        {hasPhoto ? (
          <Image
            source={{ uri: complaint.photo_url! }}
            style={{ width: 52, height: 52, borderRadius: 16 }}
            contentFit="cover"
            accessibilityLabel="Complaint photo"
          />
        ) : (
          <View className="h-[52px] w-[52px] items-center justify-center rounded-2xl bg-primary/10">
            <Icon
              family="ionic"
              name="construct-outline"
              size={24}
              color={colors.primary}
            />
          </View>
        )}

        <View className="relative min-h-[52px] min-w-0 flex-1">
          <View className="flex-row items-start gap-2 pr-7">
            <View className="min-w-0 flex-1">
              <Text variant="label" numberOfLines={1}>
                {categoryLabel}
              </Text>
              <Text variant="caption" tone="muted" className="mt-0.5" numberOfLines={2}>
                {excerpt}
              </Text>
            </View>
            <View className="max-w-[46%] shrink-0 flex-row flex-wrap justify-end gap-1">
              <Badge
                tone={badge.tone}
                label={badge.label}
                className={TAG_CLASS}
                labelClassName={TAG_LABEL_CLASS}
              />
              {!hideFlat ? (
                <Badge
                  tone="muted"
                  label={flatLabel}
                  className={TAG_CLASS}
                  labelClassName={TAG_LABEL_CLASS}
                />
              ) : null}
            </View>
          </View>

          {timestamp ? (
            <Text
              variant="caption"
              tone="muted"
              className="mt-2 text-[11px] leading-4 opacity-80"
            >
              Raised · {timestamp}
            </Text>
          ) : null}

          {onPress ? (
            <View className="absolute bottom-0 right-0">
              <Icon
                family="ionic"
                name="arrow-forward"
                size={20}
                color={colors.muted}
              />
            </View>
          ) : null}
        </View>
      </View>

      {footer ? <View className="mt-3 border-t border-border pt-3">{footer}</View> : null}
    </View>
  );

  if (!onPress) return body;

  return (
    <Pressable onPress={onPress} accessibilityRole="button" className="active:opacity-90">
      {body}
    </Pressable>
  );
}
