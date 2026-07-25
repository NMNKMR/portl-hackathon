import { Image } from 'expo-image';
import { ScrollView, View } from 'react-native';

import { Badge } from '@/components/ui/badge';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import type { Notice } from '@/lib/api/notices';
import { formatJoinDate } from '@/lib/format';
import { useThemeColors } from '@/lib/theme-colors';

type NoticeDetailBodyProps = {
  notice: Notice;
  roleAccentClass: 'text-role-admin' | 'text-role-resident';
  showUnread?: boolean;
  contentPaddingBottom: number;
};

export function NoticeDetailBody({
  notice,
  roleAccentClass,
  showUnread = false,
  contentPaddingBottom,
}: NoticeDetailBodyProps) {
  const colors = useThemeColors();

  return (
    <ScrollView
      className="flex-1"
      contentContainerStyle={{
        paddingHorizontal: 24,
        paddingBottom: contentPaddingBottom,
      }}
    >
      {notice.photo_url ? (
        <Image
          source={{ uri: notice.photo_url }}
          style={{ width: '100%', height: 220, borderRadius: 16 }}
          contentFit="cover"
          accessibilityLabel={`${notice.title} image`}
        />
      ) : (
        <View className="h-52 w-full items-center justify-center rounded-2xl bg-primary/10">
          <Icon family="ionic" name="megaphone-outline" size={56} color={colors.primary} />
        </View>
      )}

      <View className="mt-4 flex-row flex-wrap items-center gap-2">
        {notice.pinned ? <Badge tone="pending" label="Pinned" /> : null}
        {showUnread && !notice.read_at ? (
          <Badge tone="pending" label="Unread" />
        ) : null}
      </View>

      <Text variant="title" className={`mt-3 ${roleAccentClass}`}>
        {notice.title}
      </Text>

      <Text variant="body" className="mt-4">
        {notice.body?.trim() || 'No details provided.'}
      </Text>

      <View className="mt-6 rounded-xl border border-border bg-card px-4 py-3">
        <Text variant="caption" tone="muted">
          Posted {formatJoinDate(notice.created_at)}
        </Text>
        {notice.valid_till ? (
          <Text variant="caption" tone="muted" className="mt-1">
            Active until {formatJoinDate(notice.valid_till)}
          </Text>
        ) : (
          <Text variant="caption" tone="muted" className="mt-1">
            No expiry
          </Text>
        )}
      </View>
    </ScrollView>
  );
}
