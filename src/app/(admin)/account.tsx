import { useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { AccountScreen } from '@/components/account-screen';
import { useAuth } from '@/hooks/use-auth';
import { useMyMemberships, useSociety } from '@/hooks/use-society';
import { useThemeColors } from '@/lib/theme-colors';

export default function AdminAccountRoute() {
  const colors = useThemeColors();
  const { profile } = useAuth();
  const params = useLocalSearchParams<{ societyId?: string; code?: string }>();

  const memberships = useMyMemberships();
  const societyId = useMemo(() => {
    if (params.societyId) return params.societyId;
    const admin = (memberships.data ?? []).find(
      (m) => m.role === 'admin' && m.status === 'approved',
    );
    return admin?.society_id;
  }, [params.societyId, memberships.data]);

  const society = useSociety(societyId);
  const code = params.code ?? society.data?.code;

  if (memberships.isLoading || (societyId && society.isLoading)) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <AccountScreen
      role="admin"
      userName={profile?.full_name}
      phone={profile?.phone}
      societyName={society.data?.name}
      societyCode={code}
    />
  );
}
