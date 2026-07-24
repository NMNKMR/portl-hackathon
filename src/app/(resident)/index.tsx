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
import {
  useMyMemberships,
  usePendingHousehold,
} from '@/hooks/use-society';
import { membershipFlatLabel } from '@/lib/api/society';
import { useThemeColors } from '@/lib/theme-colors';

function comingSoon(label: string) {
  Alert.alert('Coming next', `${label} will land with the next feature slice.`);
}

export default function ResidentHomeScreen() {
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
          m.role === 'resident' &&
          m.status === 'approved',
      );
    }
    return (memberships.data ?? []).find(
      (m) => m.role === 'resident' && m.status === 'approved',
    );
  }, [params.societyId, memberships.data]);

  const isPrimary = membership?.member_type === 'primary';
  const flatId = membership?.flat_id ?? undefined;
  const householdPending = usePendingHousehold(
    isPrimary ? flatId : undefined,
  );
  const householdPendingCount = householdPending.data?.length ?? 0;

  const flatLabel = membership ? membershipFlatLabel(membership) : null;
  const societyName = membership?.societies?.name ?? 'Your society';
  const subtitle = flatLabel
    ? `${flatLabel} · ${societyName}`
    : societyName;

  const openHousehold = () => {
    if (!membership?.society_id || !flatId) return;
    router.push({
      pathname: '/(resident)/household',
      params: {
        societyId: membership.society_id,
        flatId,
      },
    } as Href);
  };

  const quickActions: DashboardQuickAction[] = [
    {
      id: 'approve-visitors',
      label: 'Approve visitors',
      icon: 'people',
      onPress: () => comingSoon('Visitor approvals'),
    },
    {
      id: 'preapprove',
      label: 'Pre-approve',
      icon: 'qr',
      onPress: () => comingSoon('Guest pre-approval'),
    },
    ...(isPrimary
      ? [
          {
            id: 'household',
            label: 'Household',
            icon: 'people' as const,
            onPress: openHousehold,
          },
        ]
      : []),
    {
      id: 'complaint',
      label: 'Raise complaint',
      icon: 'construct',
      onPress: () => comingSoon('Complaints'),
    },
  ];

  const summaryCards: DashboardSummaryCard[] = [
    {
      id: 'pending-visitors',
      label: 'Pending visitors',
      value: '0',
      icon: 'time',
      onPress: () => comingSoon('Visitor approvals'),
    },
    {
      id: 'notices',
      label: 'New notices',
      value: '0',
      icon: 'megaphone',
      onPress: () => comingSoon('Notices'),
    },
    {
      id: 'dues',
      label: 'Dues due',
      value: '₹0',
      icon: 'cash',
      onPress: () => comingSoon('Maintenance dues'),
    },
    ...(isPrimary
      ? [
          {
            id: 'household-pending',
            label: 'Household pending',
            value: String(householdPendingCount),
            icon: 'people' as const,
            linkLabel:
              householdPendingCount > 0 ? 'Review now >' : undefined,
            onPress: openHousehold,
          },
        ]
      : []),
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
        <Text variant="title" className="text-role-resident">
          Resident
        </Text>
        <Text variant="body" tone="muted" className="mt-2">
          No approved resident membership yet.
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
      role="resident"
      userName={profile?.full_name}
      subtitle={subtitle}
      quickActions={quickActions}
      summaryCards={summaryCards}
    />
  );
}
