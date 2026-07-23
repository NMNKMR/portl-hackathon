import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo } from 'react';
import {
  ActivityIndicator,
  FlatList,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PendingJoinCard } from '@/components/admin/pending-join-card';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import {
  useMyMemberships,
  usePendingHousehold,
  useUpdateMembershipStatus,
} from '@/hooks/use-society';
import { membershipFlatLabel } from '@/lib/api/society';
import { useThemeColors } from '@/lib/theme-colors';

export default function HouseholdPendingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const params = useLocalSearchParams<{
    societyId?: string;
    flatId?: string;
  }>();

  const memberships = useMyMemberships();
  const primary = useMemo(() => {
    const list = memberships.data ?? [];
    if (params.flatId) {
      return list.find(
        (m) =>
          m.flat_id === params.flatId &&
          m.role === 'resident' &&
          m.member_type === 'primary' &&
          m.status === 'approved',
      );
    }
    if (params.societyId) {
      return list.find(
        (m) =>
          m.society_id === params.societyId &&
          m.role === 'resident' &&
          m.member_type === 'primary' &&
          m.status === 'approved',
      );
    }
    return list.find(
      (m) =>
        m.role === 'resident' &&
        m.member_type === 'primary' &&
        m.status === 'approved',
    );
  }, [memberships.data, params.flatId, params.societyId]);

  const flatId = primary?.flat_id ?? undefined;
  const societyId = primary?.society_id ?? '';
  const pending = usePendingHousehold(flatId);
  const updateStatus = useUpdateMembershipStatus();
  const rows = pending.data ?? [];
  const flatLabel = primary ? membershipFlatLabel(primary) : null;

  if (memberships.isLoading || pending.isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!primary || !flatId) {
    return (
      <View
        className="flex-1 bg-background px-6 justify-center"
        style={{ paddingBottom: insets.bottom + 16 }}
      >
        <Text variant="title">Household joins</Text>
        <Text variant="body" tone="muted" className="mt-2">
          Only the primary resident of a flat can approve household members.
        </Text>
        <Button
          className="mt-6"
          label="Back"
          fullWidth
          onPress={() => router.back()}
        />
      </View>
    );
  }

  return (
    <View
      className="flex-1 bg-background"
      style={{ paddingTop: insets.top + 16, paddingBottom: insets.bottom + 16 }}
    >
      <View className="px-6 mb-4">
        <Button
          label="Back"
          variant="ghost"
          className="mb-2 self-start px-0"
          onPress={() => router.back()}
        />
        <Text variant="title">Household joins</Text>
        <Text variant="body" tone="muted" className="mt-1">
          {flatLabel ? `${flatLabel} · ` : ''}
          {primary.societies?.name ?? 'Society'}
        </Text>
      </View>

      {pending.isError ? (
        <Text variant="caption" tone="danger" className="px-6 mb-2">
          {pending.error instanceof Error
            ? pending.error.message
            : 'Could not load household requests'}
        </Text>
      ) : null}

      <FlatList
        data={rows}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingBottom: 24,
          flexGrow: 1,
        }}
        ListEmptyComponent={
          <View className="mt-8">
            <Text variant="body" tone="muted">
              No pending household requests. Share your society code and ask
              family to join this flat.
            </Text>
          </View>
        }
        refreshing={pending.isRefetching}
        onRefresh={() => void pending.refetch()}
        renderItem={({ item }) => (
          <View className="mb-3">
            <PendingJoinCard
              item={item}
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
            />
          </View>
        )}
      />
    </View>
  );
}
