import { Image } from 'expo-image';
import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';

import { Badge } from '@/components/ui/badge';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import type { Notice } from '@/lib/api/notices';
import { cn } from '@/lib/cn';
import { formatVisitorListTimestamp } from '@/lib/format';
import { useThemeColors } from '@/lib/theme-colors';

const TAG_CLASS = 'px-1.5 py-0';
const TAG_LABEL_CLASS = 'text-[10px] leading-3';

export type NoticeCardProps = {
  notice: Notice;
  onPress?: () => void;
  trailingBadge?: ReactNode;
  showPinned?: boolean;
  showUnread?: boolean;
  className?: string;
};

function NoticeThumbnail({ photoUrl }: { photoUrl: string | null }) {
  const colors = useThemeColors();

  if (photoUrl) {
    return (
      <Image
        source={{ uri: photoUrl }}
        style={{ width: 52, height: 52, borderRadius: 16 }}
        contentFit="cover"
        accessibilityLabel="Notice image"
      />
    );
  }

  return (
    <View className="h-[52px] w-[52px] items-center justify-center rounded-2xl bg-primary/10">
      <Icon family="ionic" name="megaphone-outline" size={24} color={colors.primary} />
    </View>
  );
}

export function NoticeCard({
  notice,
  onPress,
  trailingBadge,
  showPinned = true,
  showUnread = false,
  className,
}: NoticeCardProps) {
  const colors = useThemeColors();
  const timestamp = formatVisitorListTimestamp(notice.created_at);
  const excerpt = notice.body?.trim() || 'Society announcement';
  const isUnread = showUnread && !notice.read_at;

  const body = (
    <View
      className={cn(
        'mb-3 flex-row items-start gap-3 rounded-2xl border border-border bg-card p-3',
        className,
      )}
    >
      <NoticeThumbnail photoUrl={notice.photo_url} />

      <View className="relative min-h-[52px] min-w-0 flex-1">
        <View className="flex-row items-start gap-2 pr-7">
          <View className="min-w-0 flex-1">
            <Text variant="label" numberOfLines={2}>
              {notice.title}
            </Text>
            <Text variant="caption" tone="muted" className="mt-0.5" numberOfLines={2}>
              {excerpt}
            </Text>
          </View>
          <View className="max-w-[46%] shrink-0 flex-row flex-wrap justify-end gap-1">
            {showPinned && notice.pinned ? (
              <Badge
                tone="pending"
                label="Pinned"
                className={TAG_CLASS}
                labelClassName={TAG_LABEL_CLASS}
              />
            ) : null}
            {isUnread ? (
              <Badge
                tone="pending"
                label="Unread"
                className={TAG_CLASS}
                labelClassName={TAG_LABEL_CLASS}
              />
            ) : null}
            {trailingBadge}
          </View>
        </View>

        {timestamp ? (
          <Text
            variant="caption"
            tone="muted"
            className="mt-2 text-[11px] leading-4 opacity-80"
          >
            Posted · {timestamp}
            {notice.valid_till
              ? ` · until ${formatVisitorListTimestamp(notice.valid_till)}`
              : ''}
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
  );

  if (!onPress) return body;

  return (
    <Pressable onPress={onPress} accessibilityRole="button" className="active:opacity-90">
      {body}
    </Pressable>
  );
}
