import { useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { AccountScreen } from '@/components/account-screen';
import { useMyMemberships } from '@/hooks/use-society';
import { useThemeColors } from '@/lib/theme-colors';

export default function GuardAccountRoute() {
  const colors = useThemeColors();
  const params = useLocalSearchParams<{ societyId?: string }>();
  const memberships = useMyMemberships();

  const membership = useMemo(() => {
    const rows = memberships.data ?? [];
    if (params.societyId) {
      return rows.find(
        (m) =>
          m.society_id === params.societyId &&
          m.role === 'guard' &&
          m.status === 'approved',
      );
    }
    return rows.find((m) => m.role === 'guard' && m.status === 'approved');
  }, [memberships.data, params.societyId]);

  if (memberships.isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <AccountScreen
      role="guard"
      societyId={membership?.society_id}
      societyName={membership?.societies?.name}
      societyCode={membership?.societies?.code}
    />
  );
}
