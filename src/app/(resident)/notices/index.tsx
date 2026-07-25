import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { useMemo } from 'react';
import {
  ActivityIndicator,
  FlatList,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { NoticeCard } from '@/components/notices/notice-card';
import { Text } from '@/components/ui/text';
import { useActiveNotices } from '@/hooks/use-notices';
import { useMyMemberships } from '@/hooks/use-society';
import type { Notice } from '@/lib/api/notices';
import { useThemeColors } from '@/lib/theme-colors';

export default function ResidentNoticesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const params = useLocalSearchParams<{ societyId?: string }>();
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

  const notices = useActiveNotices({
    societyId: membership?.society_id,
    membershipId: membership?.id,
  });

  const openDetail = (notice: Notice) => {
    const href = membership?.society_id
      ? (`/(resident)/notices/${notice.id}?societyId=${encodeURIComponent(membership.society_id)}` as Href)
      : (`/(resident)/notices/${notice.id}` as Href);
    router.push(href);
  };

  if (memberships.isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!membership?.society_id) {
    return (
      <View className="flex-1 bg-background px-6 justify-center">
        <Text variant="title" className="text-role-resident">
          Notices
        </Text>
        <Text variant="body" tone="muted" className="mt-2">
          No approved resident membership.
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <View
        className="flex-1 px-5"
        style={{ paddingTop: insets.top + 12 }}
      >
        <Text variant="title" className="text-role-resident">
          Notices
        </Text>
        <Text variant="body" tone="muted" className="mt-1 mb-4">
          Active society announcements
        </Text>

        {notices.isLoading ? (
          <ActivityIndicator color={colors.roleResident} />
        ) : (
          <FlatList
            data={notices.data ?? []}
            keyExtractor={(item) => item.id}
            refreshing={notices.isRefetching}
            onRefresh={() => void notices.refetch()}
            contentContainerStyle={{ paddingBottom: 24, flexGrow: 1 }}
            ListEmptyComponent={
              <View className="items-center py-16">
                <Text variant="body" tone="muted">
                  No active notices.
                </Text>
              </View>
            }
            renderItem={({ item }) => (
              <NoticeCard
                notice={item}
                showPinned={false}
                showUnread
                onPress={() => openDetail(item)}
              />
            )}
          />
        )}
      </View>

    </View>
  );
}
