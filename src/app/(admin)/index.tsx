import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { useMemo } from 'react';
import { ActivityIndicator, Alert, Pressable, Share, View } from 'react-native';

import { PendingJoinCard } from '@/components/admin/pending-join-card';
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
  usePendingMemberships,
  useSociety,
  useUpdateMembershipStatus,
} from '@/hooks/use-society';
import { useThemeColors } from '@/lib/theme-colors';

function comingSoon(label: string) {
  Alert.alert('Coming next', `${label} will land with the next feature slice.`);
}

export default function AdminHomeScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const { profile } = useAuth();
  const params = useLocalSearchParams<{
    societyId?: string;
    code?: string;
  }>();

  const memberships = useMyMemberships();
  const societyId = useMemo(() => {
    if (params.societyId) return params.societyId;
    const admin = (memberships.data ?? []).find(
      (m) => m.role === 'admin' && m.status === 'approved',
    );
    return admin?.society_id;
  }, [params.societyId, memberships.data]);

  const society = useSociety(societyId);
  const pending = usePendingMemberships(societyId);
  const updateStatus = useUpdateMembershipStatus();
  const code = params.code ?? society.data?.code;
  const pendingRows = pending.data ?? [];
  const societyName = society.data?.name ?? 'Your society';

  const quickActions: DashboardQuickAction[] = [
    {
      id: 'pending',
      label: 'Pending joins',
      icon: 'people',
      onPress: () =>
        router.push({
          pathname: '/(admin)/pending',
          params: { societyId: societyId! },
        }),
    },
    {
      id: 'flats',
      label: 'Blocks & flats',
      icon: 'grid',
      onPress: () =>
        router.push({
          pathname: '/(admin)/flats',
          params: { societyId: societyId! },
        } as unknown as Href),
    },
    {
      id: 'share',
      label: 'Share code',
      icon: 'share',
      onPress: () => {
        if (!code) return;
        void Share.share({
          message: `Join ${societyName} on Portl with code: ${code}`,
        });
      },
    },
    {
      id: 'notices',
      label: 'Compose notice',
      icon: 'megaphone',
      onPress: () => comingSoon('Notice composer'),
    },
  ];

  const summaryCards: DashboardSummaryCard[] = [
    {
      id: 'pending',
      label: 'Pending joins',
      value: String(pendingRows.length),
      icon: 'time',
      linkLabel: pendingRows.length > 0 ? 'Review now >' : undefined,
      onPress: () =>
        router.push({
          pathname: '/(admin)/pending',
          params: { societyId: societyId! },
        }),
    },
    {
      id: 'residents',
      label: 'Residents',
      value: '—',
      icon: 'people',
      onPress: () => comingSoon('Residents directory'),
    },
    {
      id: 'complaints',
      label: 'Open complaints',
      value: '0',
      icon: 'construct',
      onPress: () => comingSoon('Complaints triage'),
    },
    {
      id: 'notices',
      label: 'Active notices',
      value: '0',
      icon: 'megaphone',
      onPress: () => comingSoon('Notices'),
    },
  ];

  if (memberships.isLoading || (societyId && society.isLoading)) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!societyId) {
    return (
      <View className="flex-1 bg-background px-6 justify-center">
        <Text variant="title" className="text-role-admin">
          Admin
        </Text>
        <Text variant="body" tone="muted" className="mt-2">
          No approved admin membership yet.
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
      role="admin"
      userName={profile?.full_name}
      subtitle={societyName}
      quickActions={quickActions}
      summaryCards={summaryCards}
    >
      <View className="mt-8">
        <View className="mb-3 flex-row items-center justify-between">
          <Text variant="label">Waiting for approval</Text>
          {pendingRows.length > 0 ? (
            <Pressable
              onPress={() =>
                router.push({
                  pathname: '/(admin)/pending',
                  params: { societyId },
                })
              }
            >
              <Text variant="caption" tone="primary">
                See all
              </Text>
            </Pressable>
          ) : null}
        </View>

        {pending.isLoading ? (
          <ActivityIndicator color={colors.primary} />
        ) : pending.isError ? (
          <View className="gap-2">
            <Text variant="caption" tone="danger">
              {pending.error instanceof Error
                ? pending.error.message
                : 'Could not load pending joins'}
            </Text>
            <Button
              label="Retry"
              variant="outline"
              fullWidth
              onPress={() => void pending.refetch()}
            />
          </View>
        ) : pendingRows.length === 0 ? (
          <Text variant="body" tone="muted">
            No pending join requests.
          </Text>
        ) : (
          <View>
            {pendingRows.slice(0, 3).map((item) => (
              <PendingJoinCard
                key={item.id}
                item={item}
                compact
                isApproving={
                  updateStatus.isPending &&
                  updateStatus.variables?.membershipId === item.id &&
                  updateStatus.variables?.status === 'approved'
                }
                isRejecting={
                  updateStatus.isPending &&
                  updateStatus.variables?.membershipId === item.id &&
                  updateStatus.variables?.status === 'rejected'
                }
                onApprove={() =>
                  void updateStatus.mutateAsync({
                    membershipId: item.id,
                    status: 'approved',
                    societyId,
                  })
                }
                onReject={() =>
                  void updateStatus.mutateAsync({
                    membershipId: item.id,
                    status: 'rejected',
                    societyId,
                  })
                }
              />
            ))}
          </View>
        )}
      </View>
    </RoleDashboardShell>
  );
}
