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
import { VisitorFlowHeader } from '@/components/visitors/visitor-flow-header';
import { VisitorRequestCard } from '@/components/visitors/visitor-request-card';
import { useMyMemberships } from '@/hooks/use-society';
import { useFlatVisitors, useVisitorRealtime } from '@/hooks/use-visitors';
import { membershipFlatLabel } from '@/lib/api/society';
import type { VisitorRequest } from '@/lib/api/visitors';
import {
  filterVisitorsByDate,
  type VisitorDateRange,
} from '@/lib/visitor-filters';
import { useThemeColors } from '@/lib/theme-colors';

type ListRow =
  | { kind: 'header'; key: string; title: string }
  | { kind: 'visitor'; key: string; visitor: VisitorRequest };

export default function ResidentVisitorsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const params = useLocalSearchParams<{
    societyId?: string;
    filter?: string;
  }>();
  const pendingOnly = params.filter === 'pending';
  const [dateRange, setDateRange] = useState<VisitorDateRange>('week');

  const memberships = useMyMemberships();
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
  const societyId = membership?.society_id;

  const visitors = useFlatVisitors(flatId);
  useVisitorRealtime({ flatId, enabled: Boolean(flatId) });

  const rows = useMemo((): ListRow[] => {
    const list = filterVisitorsByDate(visitors.data ?? [], dateRange);
    const pending = list.filter((v) => v.status === 'pending');
    const others = list.filter((v) => v.status !== 'pending');

    if (pendingOnly) {
      return pending.map((visitor) => ({
        kind: 'visitor' as const,
        key: visitor.id,
        visitor,
      }));
    }

    const out: ListRow[] = [];
    if (pending.length > 0) {
      out.push({ kind: 'header', key: 'h-pending', title: 'Needs approval' });
      for (const visitor of pending) {
        out.push({ kind: 'visitor', key: visitor.id, visitor });
      }
    }
    if (others.length > 0) {
      out.push({
        kind: 'header',
        key: 'h-others',
        title: pending.length > 0 ? 'Earlier' : 'All visitors',
      });
      for (const visitor of others) {
        out.push({ kind: 'visitor', key: visitor.id, visitor });
      }
    }
    return out;
  }, [dateRange, pendingOnly, visitors.data]);

  const openDetail = (id: string) => {
    const qs = societyId
      ? `?societyId=${encodeURIComponent(societyId)}`
      : '';
    router.push(`/(resident)/visitors/${id}${qs}` as Href);
  };

  if (memberships.isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!membership || !flatId) {
    return (
      <View className="flex-1 bg-background">
        <View
          className="flex-1 justify-center px-6"
          style={{ paddingTop: insets.top + 16 }}
        >
          <Text variant="title" className="text-role-resident">
            Visitors
          </Text>
          <Text variant="body" tone="muted" className="mt-2">
            No approved resident membership with a flat yet.
          </Text>
          <Button
            className="mt-6"
            label="Go to hub"
            fullWidth
            onPress={() => router.replace('/(app)' as Href)}
          />
        </View>
      </View>
    );
  }

  const contextLine = [membershipFlatLabel(membership), membership.societies?.name]
    .filter(Boolean)
    .join(' · ');

  return (
    <View className="flex-1 bg-background">
      <View className="flex-1 px-5" style={{ paddingTop: insets.top + 16 }}>
        <VisitorFlowHeader
          role="resident"
          title={pendingOnly ? 'Pending visitors' : 'Visitors'}
          subtitle={contextLine}
          rightSlot={
            pendingOnly ? (
              <Button
                variant="ghost"
                size="sm"
                label="Show all"
                onPress={() => {
                  const href = societyId
                    ? (`/(resident)/visitors?societyId=${encodeURIComponent(societyId)}` as Href)
                    : ('/(resident)/visitors' as Href);
                  router.replace(href);
                }}
              />
            ) : undefined
          }
        />

        {!pendingOnly ? (
          <View className="mt-4">
            <VisitorDateFilterChips
              value={dateRange}
              onChange={setDateRange}
              activeContainerClassName="border-role-resident bg-role-resident/15"
              activeLabelClassName="text-role-resident"
            />
          </View>
        ) : null}

        {visitors.isError ? (
          <Text variant="caption" tone="danger" className="mb-2 mt-4">
            {visitors.error instanceof Error
              ? visitors.error.message
              : 'Could not load visitors'}
          </Text>
        ) : null}

        {visitors.isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : (
          <FlatList
            className="mt-5"
            data={rows}
            keyExtractor={(item) => item.key}
            contentContainerStyle={{
              paddingBottom: 40,
              flexGrow: 1,
            }}
            refreshing={visitors.isRefetching}
            onRefresh={() => void visitors.refetch()}
            ListEmptyComponent={
              <View className="mt-10 items-center px-4">
                <View className="mb-3 h-14 w-14 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800">
                  <Icon
                    family="ionic"
                    name="people-outline"
                    size={28}
                    color={colors.muted}
                  />
                </View>
                <Text variant="label" className="text-center">
                  {pendingOnly ? 'Nothing pending' : 'No visitors yet'}
                </Text>
                <Text variant="body" tone="muted" className="mt-1 text-center">
                  {pendingOnly
                    ? 'New gate requests for your flat will show up here.'
                    : dateRange === 'all'
                      ? 'Gate registrations and pre-approvals for your flat appear here.'
                      : 'Nothing in this date range. Try a wider filter.'}
                </Text>
              </View>
            }
            renderItem={({ item }) => {
              if (item.kind === 'header') {
                return (
                  <Text variant="label" className="mb-2 mt-2">
                    {item.title}
                  </Text>
                );
              }
              return (
                <VisitorRequestCard
                  visitor={item.visitor}
                  hideFlat
                  onPress={() => openDetail(item.visitor.id)}
                />
              );
            }}
          />
        )}
      </View>
    </View>
  );
}
