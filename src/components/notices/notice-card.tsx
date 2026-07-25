import { Image } from 'expo-image';
import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';

import { Badge } from '@/components/ui/badge';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import type { Notice } from '@/lib/api/notices';
import { cn } from '@/lib/cn';
import { formatJoinDate } from '@/lib/format';
import { useThemeColors } from '@/lib/theme-colors';

export type NoticeCardProps = {
  notice: Notice;
  onPress?: () => void;
  /** e.g. Unread badge for residents */
  trailingBadge?: ReactNode;
  showPinned?: boolean;
  className?: string;
};

function NoticeThumbnail({ photoUrl }: { photoUrl: string | null }) {
  const colors = useThemeColors();

  if (photoUrl) {
    return (
      <Image
        source={{ uri: photoUrl }}
        style={{ width: 56, height: 56, borderRadius: 12 }}
        contentFit="cover"
        accessibilityLabel="Notice image"
      />
    );
  }

  return (
    <View className="h-14 w-14 items-center justify-center rounded-xl bg-primary/10">
      <Icon family="ionic" name="megaphone-outline" size={24} color={colors.primary} />
    </View>
  );
}

export function NoticeCard({
  notice,
  onPress,
  trailingBadge,
  showPinned = true,
  className,
}: NoticeCardProps) {
  const body = (
    <View
      className={cn(
        'mb-3 flex-row gap-3 rounded-xl border border-border bg-card px-4 py-3',
        className,
      )}
    >
      <NoticeThumbnail photoUrl={notice.photo_url} />

      <View className="min-w-0 flex-1">
        <View className="flex-row items-start justify-between gap-2">
          <Text variant="label" className="flex-1" numberOfLines={2}>
            {notice.title}
          </Text>
          <View className="items-end gap-1">
            {showPinned && notice.pinned ? (
              <Badge tone="pending" label="Pinned" />
            ) : null}
            {trailingBadge}
          </View>
        </View>

        {notice.body ? (
          <Text variant="body" tone="muted" className="mt-1" numberOfLines={2}>
            {notice.body}
          </Text>
        ) : null}

        <Text variant="caption" tone="muted" className="mt-2">
          Posted {formatJoinDate(notice.created_at)}
          {notice.valid_till
            ? ` · until ${formatJoinDate(notice.valid_till)}`
            : ''}
        </Text>
      </View>
    </View>
  );

  if (!onPress) return body;

  return (
    <Pressable onPress={onPress} accessibilityRole="button" className="active:opacity-90">
      {body}
    </Pressable>
  );
}
