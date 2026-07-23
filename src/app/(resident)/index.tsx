import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { useMemo } from 'react';
import { ActivityIndicator, Share, View } from 'react-native';

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
  const pendingCount = householdPending.data?.length ?? 0;

  const flatLabel = membership ? membershipFlatLabel(membership) : null;
  const societyName = membership?.societies?.name ?? 'Your society';
  const societyCode = membership?.societies?.code;
  const subtitle = flatLabel
    ? `${flatLabel} · ${societyName}`
    : societyName;

  const inviteHousehold = () => {
    if (!societyCode || !flatLabel) return;
    void Share.share({
      message: `Join our flat on Portl.\nSociety code: ${societyCode}\nFlat: ${flatLabel}\n\n1) Sign up with your phone\n2) Join with the code\n3) Pick this flat — you'll request as a household member.`,
    });
  };

  const quickActions: DashboardQuickAction[] = [
    ...(isPrimary
      ? [
          {
            id: 'household',
            label: 'Household joins',
            icon: 'people' as const,
            onPress: () =>
              router.push({
                pathname: '/(resident)/household',
                params: {
                  societyId: membership!.society_id,
                  flatId: flatId!,
                },
              } as Href),
          },
          {
            id: 'invite',
            label: 'Invite household',
            icon: 'share' as const,
            onPress: inviteHousehold,
          },
        ]
      : []),
    {
      id: 'register',
      label: 'Register visitor',
      icon: 'people',
      disabled: true,
    },
    {
      id: 'preapprove',
      label: 'Pre-approve guest',
      icon: 'qr',
      disabled: true,
    },
    {
      id: 'notices',
      label: 'Notices',
      icon: 'megaphone',
      disabled: true,
    },
    {
      id: 'complaint',
      label: 'Raise complaint',
      icon: 'construct',
      disabled: true,
    },
  ];

  const summaryCards: DashboardSummaryCard[] = [
    {
      id: 'visitors',
      label: 'Visitors today',
      value: '0',
      icon: 'people',
    },
    {
      id: 'pending',
      label: isPrimary ? 'Household pending' : 'Pending approvals',
      value: String(isPrimary ? pendingCount : 0),
      icon: 'time',
      onPress: isPrimary
        ? () =>
            router.push({
              pathname: '/(resident)/household',
              params: {
                societyId: membership!.society_id,
                flatId: flatId!,
              },
            } as Href)
        : undefined,
    },
    {
      id: 'notices',
      label: 'New notices',
      value: '0',
      icon: 'megaphone',
    },
    {
      id: 'dues',
      label: 'Maintenance due',
      value: '₹0',
      icon: 'cash',
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
