import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { VisitorDateFilterChips } from '@/components/visitors/visitor-date-filter-chips';
import { VisitorFilterChips } from '@/components/visitors/visitor-filter-chips';
import { VisitorFlowHeader } from '@/components/visitors/visitor-flow-header';
import { VisitorRequestCard } from '@/components/visitors/visitor-request-card';
import { useMyMemberships } from '@/hooks/use-society';
import { useFlatVisitors } from '@/hooks/use-visitors';
import { type VisitorRequest } from '@/lib/api/visitors';
import {
  filterPreApprovals,
  filterVisitorsByDate,
  PRE_APPROVAL_FILTERS,
  type PreApprovalFilter,
  type VisitorDateRange,
} from '@/lib/visitor-filters';
import { useThemeColors } from '@/lib/theme-colors';
import { remainingScans } from '@/lib/visitor-qr';

function isActivePreApproval(v: VisitorRequest): boolean {
  return (
    v.initiated_by === 'resident' &&
    v.status === 'approved' &&
    remainingScans(v) > 0
  );
}

function isExhaustedPreApproval(v: VisitorRequest): boolean {
  return (
    v.initiated_by === 'resident' &&
    v.status === 'approved' &&
    remainingScans(v) === 0
  );
}

export default function ResidentPreApprovalsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const params = useLocalSearchParams<{ societyId?: string }>();
  const memberships = useMyMemberships();

  const [statusFilter, setStatusFilter] = useState<PreApprovalFilter>('active');
  const [dateRange, setDateRange] = useState<VisitorDateRange>('month');

  const membership = useMemo(() => {
    const rows = memberships.data ?? [];
    if (params.societyId) {
      return rows.find(
        (m) =>
          m.society_id === params.societyId &&
          m.role === 'resident' &&
          m.status === 'approved',
      );
    }
    return rows.find((m) => m.role === 'resident' && m.status === 'approved');
  }, [memberships.data, params.societyId]);

  const flatId = membership?.flat_id ?? undefined;
  const visitors = useFlatVisitors(flatId);

  const rows = useMemo(() => {
    const preApprovals = (visitors.data ?? [])
      .filter((v) => v.initiated_by === 'resident')
      .sort(
        (a, b) =>
          new Date(b.requested_at).getTime() -
          new Date(a.requested_at).getTime(),
      );

    const byStatus = filterPreApprovals(
      preApprovals,
      statusFilter,
      isActivePreApproval,
      isExhaustedPreApproval,
    );

    return filterVisitorsByDate(byStatus, dateRange);
  }, [dateRange, statusFilter, visitors.data]);

  const activeCount = (visitors.data ?? []).filter(isActivePreApproval).length;

  if (memberships.isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!membership?.society_id || !flatId) {
    return (
      <View className="flex-1 bg-background px-6 justify-center">
        <Text variant="title" className="text-role-resident">
          Pre-approvals
        </Text>
        <Text variant="body" tone="muted" className="mt-2">
          No approved resident flat.
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <View
        className="flex-1 px-5"
        style={{ paddingTop: insets.top + 16 }}
      >
        <VisitorFlowHeader
          role="resident"
          title="Pre-approvals"
          subtitle={`${activeCount} active pass${activeCount === 1 ? '' : 'es'}`}
          caption="Tap to view or share QR with your guest"
          showBack
          rightSlot={
            <Button
              label="New"
              size="sm"
              variant="accent"
              onPress={() =>
                router.push(
                  `/(resident)/pre-approvals/create?societyId=${encodeURIComponent(membership.society_id)}` as Href,
                )
              }
            />
          }
        />

        <View className="mt-4 gap-3">
          <VisitorFilterChips
            filters={PRE_APPROVAL_FILTERS}
            value={statusFilter}
            onChange={setStatusFilter}
            activeContainerClassName="border-role-resident bg-role-resident/15"
            activeLabelClassName="text-role-resident"
          />
          <VisitorDateFilterChips
            value={dateRange}
            onChange={setDateRange}
            activeContainerClassName="border-role-resident bg-role-resident/15"
            activeLabelClassName="text-role-resident"
          />
        </View>

        {visitors.isLoading ? (
          <View className="mt-8 items-center">
            <ActivityIndicator color={colors.roleResident} />
          </View>
        ) : (
          <FlatList
            className="mt-4"
            data={rows}
            keyExtractor={(item) => item.id}
            refreshing={visitors.isRefetching}
            onRefresh={() => void visitors.refetch()}
            contentContainerStyle={{ paddingBottom: 40, flexGrow: 1 }}
            ListEmptyComponent={
              <View className="items-center py-16 px-4">
                <View className="mb-3 h-14 w-14 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800">
                  <Icon
                    family="ionic"
                    name="qr-code-outline"
                    size={28}
                    color={colors.muted}
                  />
                </View>
                <Text variant="label" className="text-center">
                  No pre-approvals here
                </Text>
                <Text variant="body" tone="muted" className="mt-1 text-center">
                  {statusFilter === 'active'
                    ? 'Create a pass for expected guests, deliveries, or cabs.'
                    : 'Try another filter or create a new pre-approval.'}
                </Text>
                <Button
                  className="mt-5"
                  label="Create pre-approval"
                  variant="accent"
                  onPress={() =>
                    router.push(
                      `/(resident)/pre-approvals/create?societyId=${encodeURIComponent(membership.society_id)}` as Href,
                    )
                  }
                />
              </View>
            }
            renderItem={({ item }) => (
              <VisitorRequestCard
                visitor={item}
                hideFlat
                onPress={() =>
                  router.push(
                    `/(resident)/pre-approvals/${item.id}?societyId=${encodeURIComponent(membership.society_id)}` as Href,
                  )
                }
              />
            )}
          />
        )}
      </View>
    </View>
  );
}
