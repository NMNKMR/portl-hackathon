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
import { useActiveNotices } from '@/hooks/use-notices';
import { useFlatVisitors, useVisitorRealtime } from '@/hooks/use-visitors';
import { countUnreadNotices } from '@/lib/api/notices';
import { membershipFlatLabel } from '@/lib/api/society';
import { useThemeColors } from '@/lib/theme-colors';
import { remainingScans } from '@/lib/visitor-qr';

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

  const flatVisitors = useFlatVisitors(flatId);
  useVisitorRealtime({ flatId, enabled: Boolean(flatId) });
  const pendingVisitorCount = useMemo(
    () =>
      (flatVisitors.data ?? []).filter((v) => v.status === 'pending').length,
    [flatVisitors.data],
  );
  const preApprovalCount = useMemo(
    () =>
      (flatVisitors.data ?? []).filter(
        (v) =>
          v.initiated_by === 'resident' &&
          v.status === 'approved' &&
          remainingScans(v) > 0,
      ).length,
    [flatVisitors.data],
  );
  const activeNotices = useActiveNotices({
    societyId: membership?.society_id,
    membershipId: membership?.id,
  });
  const unreadNoticeCount = useMemo(
    () => countUnreadNotices(activeNotices.data ?? []),
    [activeNotices.data],
  );

  const flatLabel = membership ? membershipFlatLabel(membership) : null;
  const societyName = membership?.societies?.name ?? 'Your society';
  const subtitle = flatLabel
    ? `${flatLabel} · ${societyName}`
    : societyName;

  const openVisitors = (pendingOnly = false) => {
    if (!membership?.society_id) return;
    const qs = new URLSearchParams({ societyId: membership.society_id });
    if (pendingOnly) qs.set('filter', 'pending');
    router.push(`/(resident)/visitors?${qs.toString()}` as Href);
  };

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
      onPress: () => openVisitors(false),
    },
    {
      id: 'preapprove',
      label: 'Pre-approve',
      icon: 'qr',
      onPress: () => {
        if (!membership?.society_id) return;
        router.push(
          `/(resident)/pre-approvals?societyId=${encodeURIComponent(membership.society_id)}` as Href,
        );
      },
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
      id: 'staff',
      label: 'Staff',
      icon: 'people',
      onPress: () => {
        if (!membership?.society_id) return;
        router.push(
          `/(resident)/staff?societyId=${encodeURIComponent(membership.society_id)}` as Href,
        );
      },
    },
    {
      id: 'complaint',
      label: 'Raise complaint',
      icon: 'construct',
      onPress: () => {
        if (!membership?.society_id) return;
        router.push(
          `/(resident)/complaints?societyId=${encodeURIComponent(membership.society_id)}` as Href,
        );
      },
    },
  ];

  const summaryCards: DashboardSummaryCard[] = [
    {
      id: 'pending-visitors',
      label: 'Pending visitors',
      value: String(pendingVisitorCount),
      icon: 'time',
      linkLabel: pendingVisitorCount > 0 ? 'Review now >' : undefined,
      onPress: () => openVisitors(true),
    },
    {
      id: 'pre-approvals',
      label: 'Pre-approvals',
      value: String(preApprovalCount),
      icon: 'qr',
      linkLabel: preApprovalCount > 0 ? 'View passes >' : 'Create >',
      onPress: () => {
        if (!membership?.society_id) return;
        router.push(
          `/(resident)/pre-approvals?societyId=${encodeURIComponent(membership.society_id)}` as Href,
        );
      },
    },
    {
      id: 'notices',
      label: 'New notices',
      value: String(unreadNoticeCount),
      icon: 'megaphone',
      onPress: () => {
        if (!membership?.society_id) return;
        router.push(
          `/(resident)/notices?societyId=${encodeURIComponent(membership.society_id)}` as Href,
        );
      },
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
