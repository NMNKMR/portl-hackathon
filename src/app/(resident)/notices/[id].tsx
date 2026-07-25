import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { useEffect, useMemo } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { NoticeDetailBody } from '@/components/notices/notice-detail-body';
import { ScreenBackButton } from '@/components/ui/screen-back-button';
import { Text } from '@/components/ui/text';
import { useActiveNotices, useMarkNoticeRead, useNotice } from '@/hooks/use-notices';
import { useMyMemberships } from '@/hooks/use-society';
import { useThemeColors } from '@/lib/theme-colors';

export default function ResidentNoticeDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const params = useLocalSearchParams<{ id?: string; societyId?: string }>();
  const noticeId = typeof params.id === 'string' ? params.id : undefined;

  const memberships = useMyMemberships();
  const membership = useMemo(() => {
    const rows = memberships.data ?? [];
    if (params.societyId) {
      return rows.find(
        (m) =>
          m.society_id === params.societyId &&
          m.role === 'resident' &&
          m.status === 'approved',
      );
    }
    return rows.find((m) => m.role === 'resident' && m.status === 'approved');
  }, [memberships.data, params.societyId]);

  const notice = useNotice(noticeId);
  const activeNotices = useActiveNotices({
    societyId: membership?.society_id,
    membershipId: membership?.id,
  });
  const markRead = useMarkNoticeRead();

  const readAt = useMemo(() => {
    if (!noticeId) return null;
    const fromList = activeNotices.data?.find((n) => n.id === noticeId)?.read_at;
    return fromList ?? null;
  }, [activeNotices.data, noticeId]);

  const noticeWithRead = notice.data
    ? { ...notice.data, read_at: readAt }
    : null;

  useEffect(() => {
    if (!membership?.id || !noticeId || readAt) return;
    void markRead.mutate({ noticeId, membershipId: membership.id });
  }, [membership?.id, noticeId, readAt, markRead]);

  if (memberships.isLoading || notice.isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator color={colors.roleResident} />
      </View>
    );
  }

  if (!membership) {
    return (
      <View
        className="flex-1 bg-background px-6 justify-center"
        style={{ paddingTop: insets.top }}
      >
        <Text variant="title" className="text-role-resident">
          Notice
        </Text>
        <Text variant="body" tone="muted" className="mt-2">
          No approved resident membership.
        </Text>
      </View>
    );
  }

  if (!noticeWithRead) {
    return (
      <View
        className="flex-1 bg-background px-6 justify-center"
        style={{ paddingTop: insets.top, paddingBottom: insets.bottom + 16 }}
      >
        <Text variant="title" className="text-role-resident">
          Notice not found
        </Text>
        <Text variant="body" tone="muted" className="mt-2">
          This notice may have expired or been removed.
        </Text>
        <ScreenBackButton
          className="mt-6"
          label="Back to notices"
          onPress={() => {
            const href = membership.society_id
              ? (`/(resident)/notices?societyId=${encodeURIComponent(membership.society_id)}` as Href)
              : ('/(resident)/notices' as Href);
            router.replace(href);
          }}
        />
      </View>
    );
  }

  return (
    <View
      className="flex-1 bg-background"
      style={{ paddingTop: insets.top + 8 }}
    >
      <View className="px-6">
        <ScreenBackButton className="mb-4" />
      </View>

      <NoticeDetailBody
        notice={noticeWithRead}
        roleAccentClass="text-role-resident"
        showUnread
        contentPaddingBottom={insets.bottom + 32}
      />
    </View>
  );
}
