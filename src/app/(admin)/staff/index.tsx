import { useLocalSearchParams, type Href } from 'expo-router';
import { useMemo } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { StaffDirectoryScreen } from '@/components/staff/staff-directory-screen';
import { Text } from '@/components/ui/text';
import { useMyMemberships } from '@/hooks/use-society';
import { useThemeColors } from '@/lib/theme-colors';

export default function AdminStaffIndex() {
  const colors = useThemeColors();
  const params = useLocalSearchParams<{ societyId?: string }>();
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
        <Text variant="title" className="text-role-admin">
          Staff
        </Text>
        <Text variant="body" tone="muted" className="mt-2">
          No approved admin membership.
        </Text>
      </View>
    );
  }

  return (
    <StaffDirectoryScreen
      role="admin"
      societyId={membership.society_id}
      membershipId={membership.id}
      showBack
      detailHref={(id) =>
        `/(admin)/staff/${id}?societyId=${encodeURIComponent(membership.society_id)}` as Href
      }
    />
  );
}
