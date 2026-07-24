import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { useMemo } from 'react';
import { ActivityIndicator, Alert, View } from 'react-native';

import {
  RoleDashboardShell,
  type DashboardQuickAction,
  type DashboardSummaryCard,
} from '@/components/role-dashboard-shell';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { useAuth } from '@/hooks/use-auth';
import { useMyMemberships } from '@/hooks/use-society';
import { useThemeColors } from '@/lib/theme-colors';

function comingSoon(label: string) {
  Alert.alert('Coming next', `${label} will land with the next feature slice.`);
}

function registerVisitorAlert() {
  Alert.alert(
    'Coming next',
    'Visitor registration is the next Tier 1 slice for guards.',
  );
}

export default function GuardHomeScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const { profile } = useAuth();
  const params = useLocalSearchParams<{ societyId?: string }>();

  const memberships = useMyMemberships();
  const membership = useMemo(() => {
    if (params.societyId) {
      return (memberships.data ?? []).find(
        (m) =>
          m.society_id === params.societyId &&
          m.role === 'guard' &&
          m.status === 'approved',
      );
    }
    return (memberships.data ?? []).find(
      (m) => m.role === 'guard' && m.status === 'approved',
    );
  }, [params.societyId, memberships.data]);

  const societyName = membership?.societies?.name ?? 'Your society';

  const quickActions: DashboardQuickAction[] = [
    {
      id: 'qr',
      label: 'Scan QR',
      icon: 'qr',
      onPress: () => comingSoon('QR scanner'),
    },
    {
      id: 'log',
      label: 'Visitor log',
      icon: 'people',
      onPress: () => comingSoon('Visitor log'),
    },
  ];

  const summaryCards: DashboardSummaryCard[] = [
    {
      id: 'duty',
      label: 'On duty',
      value: 'Today',
      icon: 'shield',
      onPress: () => comingSoon('Duty details'),
    },
    {
      id: 'visitors-today',
      label: "Today's entries",
      value: '0',
      icon: 'people',
      onPress: () => comingSoon('Visitor log'),
    },
    {
      id: 'inside',
      label: 'Currently inside',
      value: '0',
      icon: 'time',
      onPress: () => comingSoon('Visitors inside'),
    },
  ];

  if (memberships.isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!membership) {
    return (
      <View className="flex-1 bg-background px-6 justify-center">
        <Text variant="title" className="text-role-guard">
          Guard
        </Text>
        <Text variant="body" tone="muted" className="mt-2">
          No approved guard membership yet.
        </Text>
        <Button
          className="mt-6"
          label="Go to hub"
          fullWidth
          onPress={() => router.replace('/(app)' as Href)}
        />
      </View>
    );
  }

  return (
    <RoleDashboardShell
      role="guard"
      userName={profile?.full_name}
      subtitle={societyName}
      quickActions={quickActions}
      summaryCards={summaryCards}
      prominentCta={{
        label: 'Register visitor',
        onPress: registerVisitorAlert,
      }}
    />
  );
}
