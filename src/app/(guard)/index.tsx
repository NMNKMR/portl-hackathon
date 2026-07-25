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
import { useSocietyVisitors, useVisitorRealtime } from '@/hooks/use-visitors';
import { useThemeColors } from '@/lib/theme-colors';

function comingSoon(label: string) {
  Alert.alert('Coming next', `${label} will land with the next feature slice.`);
}

function startOfTodayIso(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
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

  const societyId = membership?.society_id;
  const societyName = membership?.societies?.name ?? 'Your society';

  const visitorsQuery = useSocietyVisitors(societyId);
  useVisitorRealtime({ societyId, enabled: Boolean(societyId) });

  const todayStart = useMemo(() => startOfTodayIso(), []);

  const todaysEntries = useMemo(() => {
    const rows = visitorsQuery.data ?? [];
    return rows.filter(
      (v) =>
        (v.checked_in_at && v.checked_in_at >= todayStart) ||
        (!v.checked_in_at && v.requested_at >= todayStart),
    ).length;
  }, [visitorsQuery.data, todayStart]);

  const currentlyInside = useMemo(() => {
    return (visitorsQuery.data ?? []).filter((v) => v.status === 'checked_in')
      .length;
  }, [visitorsQuery.data]);

  const visitorsHref = useMemo(() => {
    if (societyId) {
      return `/(guard)/visitors?societyId=${encodeURIComponent(societyId)}` as Href;
    }
    return '/(guard)/visitors' as Href;
  }, [societyId]);

  const registerHref = useMemo(() => {
    if (societyId) {
      return `/(guard)/visitors/register?societyId=${encodeURIComponent(societyId)}` as Href;
    }
    return '/(guard)/visitors/register' as Href;
  }, [societyId]);

  const insideHref = useMemo(() => {
    if (societyId) {
      return `/(guard)/visitors?societyId=${encodeURIComponent(societyId)}&filter=inside` as Href;
    }
    return '/(guard)/visitors?filter=inside' as Href;
  }, [societyId]);

  const quickActions: DashboardQuickAction[] = [
    {
      id: 'qr',
      label: 'Scan QR',
      icon: 'qr',
      onPress: () => {
        if (!societyId) return;
        router.push(
          `/(guard)/visitors/scan?societyId=${encodeURIComponent(societyId)}` as Href,
        );
      },
    },
    {
      id: 'log',
      label: 'Visitor log',
      icon: 'people',
      onPress: () => router.push(visitorsHref),
    },
  ];

  const summaryCards: DashboardSummaryCard[] = [
    {
      id: 'staff',
      label: 'Staff passes',
      value: 'Verify',
      icon: 'shield',
      onPress: () => {
        if (!societyId) return;
        router.push(
          `/(guard)/staff?societyId=${encodeURIComponent(societyId)}` as Href,
        );
      },
    },
    {
      id: 'visitors-today',
      label: "Today's entries",
      value: String(todaysEntries),
      icon: 'people',
      onPress: () => router.push(visitorsHref),
    },
    {
      id: 'inside',
      label: 'Currently inside',
      value: String(currentlyInside),
      icon: 'time',
      onPress: () => router.push(insideHref),
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
        onPress: () => router.push(registerHref),
      }}
    />
  );
}
