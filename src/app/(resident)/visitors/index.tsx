import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { useMemo } from 'react';
import {
  ActivityIndicator,
  FlatList,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DashboardBottomNav } from '@/components/dashboard-bottom-nav';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { VisitorRequestCard } from '@/components/visitors/visitor-request-card';
import { useMyMemberships } from '@/hooks/use-society';
import { useFlatVisitors, useVisitorRealtime } from '@/hooks/use-visitors';
import { membershipFlatLabel } from '@/lib/api/society';
import type { VisitorRequest } from '@/lib/api/visitors';
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
    const list = visitors.data ?? [];
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
      out.push({ kind: 'header', key: 'h-pending', title: 'Pending' });
      for (const visitor of pending) {
        out.push({ kind: 'visitor', key: visitor.id, visitor });
      }
    }
    if (others.length > 0) {
      out.push({
        kind: 'header',
        key: 'h-others',
        title: pending.length > 0 ? 'Earlier' : 'Visitors',
      });
      for (const visitor of others) {
        out.push({ kind: 'visitor', key: visitor.id, visitor });
      }
    }
    return out;
  }, [pendingOnly, visitors.data]);

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
        <DashboardBottomNav
          role="resident"
          roleAccent={colors.roleResident}
          activeTab="visitors"
        />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <View className="flex-1" style={{ paddingTop: insets.top + 16 }}>
        <View className="mb-4 px-6">
          <Text variant="title" className="text-role-resident">
            {pendingOnly ? 'Pending visitors' : 'Visitors'}
          </Text>
          <Text variant="body" tone="muted" className="mt-1">
            {[membershipFlatLabel(membership), membership.societies?.name]
              .filter(Boolean)
              .join(' · ')}
          </Text>
          {pendingOnly ? (
            <Button
              className="mt-3 self-start px-0"
              variant="ghost"
              size="sm"
              label="Show all visitors"
              onPress={() => {
                const href = societyId
                  ? (`/(resident)/visitors?societyId=${encodeURIComponent(societyId)}` as Href)
                  : ('/(resident)/visitors' as Href);
                router.replace(href);
              }}
            />
          ) : null}
        </View>

        {visitors.isError ? (
          <Text variant="caption" tone="danger" className="mb-2 px-6">
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
            data={rows}
            keyExtractor={(item) => item.key}
            contentContainerStyle={{
              paddingHorizontal: 24,
              paddingBottom: 24,
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
                <Text variant="body" tone="muted" className="text-center">
                  {pendingOnly
                    ? 'No pending visitor requests for your flat.'
                    : 'No visitor requests yet. Guards will appear here when they register someone for your flat.'}
                </Text>
              </View>
            }
            renderItem={({ item }) => {
              if (item.kind === 'header') {
                return (
                  <Text
                    variant="label"
                    tone="muted"
                    className="mb-2 mt-1 uppercase tracking-wide"
                  >
                    {item.title}
                  </Text>
                );
              }
              return (
                <VisitorRequestCard
                  visitor={item.visitor}
                  onPress={() => openDetail(item.visitor.id)}
                  trailing={
                    <Icon
                      family="ionic"
                      name="chevron-forward"
                      size={18}
                      color={colors.muted}
                    />
                  }
                />
              );
            }}
          />
        )}
      </View>

      <DashboardBottomNav
        role="resident"
        roleAccent={colors.roleResident}
        activeTab="visitors"
      />
    </View>
  );
}
