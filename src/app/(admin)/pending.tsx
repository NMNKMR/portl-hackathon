import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AdminScreenHeader } from '@/components/admin/admin-screen-header';
import { PendingJoinCard } from '@/components/admin/pending-join-card';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { ScreenBackButton } from '@/components/ui/screen-back-button';
import { Text } from '@/components/ui/text';
import {
  useBatchUpdateMembershipStatus,
  useMyMemberships,
  usePendingMemberships,
  useSociety,
  useUpdateMembershipStatus,
} from '@/hooks/use-society';
import { useThemeColors } from '@/lib/theme-colors';

export default function AdminPendingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const params = useLocalSearchParams<{ societyId?: string }>();

  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

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
  const batchUpdate = useBatchUpdateMembershipStatus();
  const rows = pending.data ?? [];
  const selectedCount = selectedIds.size;
  const isBusy = updateStatus.isPending || batchUpdate.isPending;

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
    setSelectMode(false);
  }, []);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const runBatch = async (
    membershipIds: string[],
    status: 'approved' | 'rejected',
  ) => {
    if (!societyId || membershipIds.length === 0) return;
    await batchUpdate.mutateAsync({ membershipIds, status, societyId });
    clearSelection();
  };

  const handleApproveAll = () => {
    void runBatch(
      rows.map((row) => row.id),
      'approved',
    );
  };

  const handleApproveSelected = () => {
    void runBatch(Array.from(selectedIds), 'approved');
  };

  const handleRejectSelected = () => {
    void runBatch(Array.from(selectedIds), 'rejected');
  };

  if (memberships.isLoading || pending.isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!societyId) {
    return (
      <View className="flex-1 bg-background px-6 justify-center">
        <Text variant="title">No society</Text>
        <ScreenBackButton className="mt-6" />
      </View>
    );
  }

  const headerRight = (
    <View className="items-end gap-2">
      <Pressable
        onPress={() => {
          if (selectMode) clearSelection();
          else setSelectMode(true);
        }}
        hitSlop={8}
      >
        <Text variant="label" className="text-role-admin">
          {selectMode ? 'Cancel' : 'Select'}
        </Text>
      </Pressable>
      {!selectMode && rows.length > 0 ? (
        <Pressable
          onPress={() => void handleApproveAll()}
          disabled={isBusy}
          hitSlop={8}
        >
          <Text variant="label" tone="accent">
            Approve all
          </Text>
        </Pressable>
      ) : null}
    </View>
  );

  return (
    <View
      className="flex-1 bg-background"
      style={{
        paddingTop: insets.top + 16,
        paddingBottom: selectedCount > 0 ? 0 : insets.bottom + 16,
      }}
    >
      <View className="px-6">
        <AdminScreenHeader
          title="Pending joins"
          subtitle={society.data?.name ?? 'Your society'}
          onBack={() => router.back()}
          rightSlot={headerRight}
        />

        <Text variant="caption" tone="muted" className="mb-4">
          {rows.length} {rows.length === 1 ? 'request' : 'requests'}
        </Text>

        {pending.isError ? (
          <Text variant="caption" tone="danger" className="mb-2">
            {pending.error instanceof Error
              ? pending.error.message
              : 'Could not load pending joins'}
          </Text>
        ) : null}
      </View>

      <FlatList
        data={rows}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingBottom: selectedCount > 0 ? 120 : 24,
          flexGrow: 1,
        }}
        ListEmptyComponent={
          <View className="mt-8">
            <Text variant="body" tone="muted">
              No pending requests.
            </Text>
          </View>
        }
        refreshing={pending.isRefetching}
        onRefresh={() => void pending.refetch()}
        renderItem={({ item }) => {
          const isApproving =
            (updateStatus.isPending &&
              updateStatus.variables?.membershipId === item.id &&
              updateStatus.variables?.status === 'approved') ||
            (batchUpdate.isPending &&
              batchUpdate.variables?.status === 'approved' &&
              (batchUpdate.variables.membershipIds.includes(item.id) ||
                batchUpdate.variables.membershipIds.length === rows.length));

          const isRejecting =
            (updateStatus.isPending &&
              updateStatus.variables?.membershipId === item.id &&
              updateStatus.variables?.status === 'rejected') ||
            (batchUpdate.isPending &&
              batchUpdate.variables?.status === 'rejected' &&
              batchUpdate.variables.membershipIds.includes(item.id));

          return (
            <PendingJoinCard
              item={item}
              selectMode={selectMode}
              selected={selectedIds.has(item.id)}
              onToggleSelect={() => toggleSelect(item.id)}
              isApproving={isApproving}
              isRejecting={isRejecting}
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
          );
        }}
      />

      {selectedCount > 0 ? (
        <View
          className="absolute bottom-0 left-0 right-0 border-t border-border bg-role-admin px-5 pt-3"
          style={{ paddingBottom: insets.bottom + 12 }}
        >
          <View className="flex-row items-center justify-between gap-3">
            <View className="flex-row items-center gap-2">
              <Icon
                family="ionic"
                name="checkmark-circle"
                size={20}
                color={colors.onPrimary}
              />
              <Text variant="label" tone="inverse">
                {selectedCount} selected
              </Text>
            </View>
            <View className="flex-row gap-2">
              <Button
                size="sm"
                variant="accent"
                label="Approve selected"
                loading={
                  batchUpdate.isPending &&
                  batchUpdate.variables?.status === 'approved'
                }
                disabled={isBusy}
                onPress={() => void handleApproveSelected()}
              />
              <Button
                size="sm"
                variant="outlineDanger"
                label="Reject selected"
                loading={
                  batchUpdate.isPending &&
                  batchUpdate.variables?.status === 'rejected'
                }
                disabled={isBusy}
                onPress={() => void handleRejectSelected()}
              />
            </View>
          </View>
        </View>
      ) : null}
    </View>
  );
}
