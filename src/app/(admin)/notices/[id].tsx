import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AdminScreenHeader } from '@/components/admin/admin-screen-header';
import { NoticeDetailBody } from '@/components/notices/notice-detail-body';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { useNotice } from '@/hooks/use-notices';
import { useMyMemberships } from '@/hooks/use-society';
import { useThemeColors } from '@/lib/theme-colors';

export default function AdminNoticeDetailScreen() {
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
          m.role === 'admin' &&
          m.status === 'approved',
      );
    }
    return rows.find((m) => m.role === 'admin' && m.status === 'approved');
  }, [memberships.data, params.societyId]);

  const notice = useNotice(noticeId);

  if (memberships.isLoading || notice.isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator color={colors.roleAdmin} />
      </View>
    );
  }

  if (!membership) {
    return (
      <View
        className="flex-1 bg-background px-6 justify-center"
        style={{ paddingTop: insets.top }}
      >
        <Text variant="title" className="text-role-admin">
          Notice
        </Text>
        <Text variant="body" tone="muted" className="mt-2">
          No approved admin membership.
        </Text>
      </View>
    );
  }

  if (!notice.data) {
    return (
      <View
        className="flex-1 bg-background px-6"
        style={{ paddingTop: insets.top + 12, paddingBottom: insets.bottom + 16 }}
      >
        <AdminScreenHeader title="Notice not found" subtitle="This notice may have been removed." />
        <Button label="Back to notices" fullWidth onPress={() => router.back()} />
      </View>
    );
  }

  return (
    <View
      className="flex-1 bg-background"
      style={{ paddingTop: insets.top + 8 }}
    >
      <View className="px-6">
        <AdminScreenHeader title="Notice" subtitle="Society announcement" />
      </View>

      <NoticeDetailBody
        notice={notice.data}
        roleAccentClass="text-role-admin"
        contentPaddingBottom={insets.bottom + 32}
      />
    </View>
  );
}
