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
import {
  useSocietyVisitors,
  useVisitorRealtime,
} from '@/hooks/use-visitors';
import { type VisitorRequest } from '@/lib/api/visitors';
import {
  filterVisitorsByDate,
  type VisitorDateRange,
} from '@/lib/visitor-filters';
import { useThemeColors } from '@/lib/theme-colors';

type FilterId = 'all' | 'pending' | 'approved' | 'preapproved' | 'inside';

const FILTERS: { id: FilterId; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'pending', label: 'Pending' },
  { id: 'approved', label: 'Approved' },
  { id: 'preapproved', label: 'Pre-approved' },
  { id: 'inside', label: 'Inside' },
];

function normalizeFilter(raw: string | undefined): FilterId {
  if (
    raw === 'pending' ||
    raw === 'approved' ||
    raw === 'inside' ||
    raw === 'preapproved'
  ) {
    return raw;
  }
  if (raw === 'checked_in') return 'inside';
  return 'all';
}

function matchesFilter(visitor: VisitorRequest, filter: FilterId): boolean {
  if (filter === 'all') return true;
  if (filter === 'inside') return visitor.status === 'checked_in';
  if (filter === 'preapproved') {
    return (
      visitor.initiated_by === 'resident' &&
      (visitor.status === 'approved' ||
        (visitor.max_scans > 1 && visitor.scan_count > 0))
    );
  }
  return visitor.status === filter;
}

export default function GuardVisitorsListScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const params = useLocalSearchParams<{
    societyId?: string;
    filter?: string;
  }>();

  const memberships = useMyMemberships();
  const membership = useMemo(() => {
    const rows = memberships.data ?? [];
    if (params.societyId) {
      return rows.find(
        (m) =>
          m.society_id === params.societyId &&
          m.role === 'guard' &&
          m.status === 'approved',
      );
    }
    return rows.find((m) => m.role === 'guard' && m.status === 'approved');
  }, [memberships.data, params.societyId]);

  const societyId = membership?.society_id;
  const visitorsQuery = useSocietyVisitors(societyId);
  useVisitorRealtime({ societyId, enabled: Boolean(societyId) });

  const [filter, setFilter] = useState<FilterId>(() =>
    normalizeFilter(
      typeof params.filter === 'string' ? params.filter : undefined,
    ),
  );
  const [dateRange, setDateRange] = useState<VisitorDateRange>('week');

  const filtered = useMemo(() => {
    const rows = visitorsQuery.data ?? [];
    const byStatus = rows.filter((v) => matchesFilter(v, filter));
    return filterVisitorsByDate(byStatus, dateRange);
  }, [visitorsQuery.data, filter, dateRange]);

  const registerHref = useMemo(() => {
    if (societyId) {
      return `/(guard)/visitors/register?societyId=${encodeURIComponent(societyId)}` as Href;
    }
    return '/(guard)/visitors/register' as Href;
  }, [societyId]);

  if (memberships.isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!membership || !societyId) {
    return (
      <View className="flex-1 bg-background px-6 justify-center">
        <Text variant="title" className="text-role-guard">
          Visitors
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

  const societyName = membership.societies?.name ?? 'Your society';

  return (
    <View className="flex-1 bg-background">
      <View
        className="flex-1 px-5"
        style={{ paddingTop: insets.top + 16 }}
      >
        <VisitorFlowHeader
          role="guard"
          title="Visitor log"
          subtitle={societyName}
          rightSlot={
            <View className="flex-row gap-2">
              <Button
                label="Scan"
                size="sm"
                variant="outline"
                icon={{ family: 'ionic', name: 'qr-code-outline' }}
                onPress={() =>
                  router.push(
                    `/(guard)/visitors/scan?societyId=${encodeURIComponent(societyId)}` as Href,
                  )
                }
              />
              <Button
                label="Register"
                size="sm"
                variant="accent"
                icon={{ family: 'ionic', name: 'add-circle-outline' }}
                onPress={() => router.push(registerHref)}
              />
            </View>
          }
        />

        <View className="mt-5 gap-3">
          <VisitorFilterChips
            filters={FILTERS}
            value={filter}
            onChange={setFilter}
          />
          <VisitorDateFilterChips
            value={dateRange}
            onChange={setDateRange}
            activeContainerClassName="border-role-guard bg-role-guard/15"
            activeLabelClassName="text-role-guard"
          />
        </View>

        {visitorsQuery.isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : visitorsQuery.isError ? (
          <View className="flex-1 items-center justify-center px-4">
            <View className="mb-3 h-14 w-14 items-center justify-center rounded-full bg-danger/10">
              <Icon
                family="ionic"
                name="alert-circle-outline"
                size={28}
                color={colors.danger}
              />
            </View>
            <Text variant="label" className="text-center">
              Could not load log
            </Text>
            <Text variant="body" tone="muted" className="mt-1 text-center">
              {visitorsQuery.error instanceof Error
                ? visitorsQuery.error.message
                : 'Please try again.'}
            </Text>
            <Button
              className="mt-4"
              label="Retry"
              variant="outline"
              onPress={() => void visitorsQuery.refetch()}
            />
          </View>
        ) : (
          <FlatList
            className="mt-4"
            data={filtered}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingBottom: 40, flexGrow: 1 }}
            showsVerticalScrollIndicator={false}
            refreshing={visitorsQuery.isRefetching}
            onRefresh={() => void visitorsQuery.refetch()}
            ListEmptyComponent={
              <View className="flex-1 items-center justify-center px-6 py-16">
                <View className="mb-3 h-14 w-14 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800">
                  <Icon
                    family="ionic"
                    name="people-outline"
                    size={28}
                    color={colors.muted}
                  />
                </View>
                <Text variant="label" className="text-center">
                  {filter === 'all' ? 'No visitors yet' : 'Nothing in this filter'}
                </Text>
                <Text variant="body" tone="muted" className="mt-1 text-center">
                  {filter === 'all' && dateRange === 'all'
                    ? 'Register someone at the gate to start the log.'
                    : 'Nothing matches these filters. Try another combination.'}
                </Text>
                {filter === 'all' ? (
                  <Button
                    className="mt-5"
                    label="Register visitor"
                    variant="accent"
                    onPress={() => router.push(registerHref)}
                  />
                ) : null}
              </View>
            }
            renderItem={({ item }) => (
              <VisitorRequestCard
                visitor={item}
                onPress={() =>
                  router.push(`/(guard)/visitors/${item.id}` as Href)
                }
              />
            )}
          />
        )}
      </View>
    </View>
  );
}
