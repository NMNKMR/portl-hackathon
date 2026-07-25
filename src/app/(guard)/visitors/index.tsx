import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DashboardBottomNav } from '@/components/dashboard-bottom-nav';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { VisitorRequestCard } from '@/components/visitors/visitor-request-card';
import { useMyMemberships } from '@/hooks/use-society';
import {
  useSocietyVisitors,
  useVisitorRealtime,
} from '@/hooks/use-visitors';
import { type VisitorRequest } from '@/lib/api/visitors';
import { useThemeColors } from '@/lib/theme-colors';

type FilterId = 'all' | 'pending' | 'approved' | 'inside';

const FILTERS: { id: FilterId; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'pending', label: 'Pending' },
  { id: 'approved', label: 'Approved' },
  { id: 'inside', label: 'Inside' },
];

function normalizeFilter(raw: string | undefined): FilterId {
  if (raw === 'pending' || raw === 'approved' || raw === 'inside') return raw;
  if (raw === 'checked_in') return 'inside';
  return 'all';
}

function matchesFilter(visitor: VisitorRequest, filter: FilterId): boolean {
  if (filter === 'all') return true;
  if (filter === 'inside') return visitor.status === 'checked_in';
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

  const filtered = useMemo(() => {
    const rows = visitorsQuery.data ?? [];
    return rows.filter((v) => matchesFilter(v, filter));
  }, [visitorsQuery.data, filter]);

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
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      <View className="flex-1 px-5 pt-3">
        <View className="mb-4 flex-row items-start justify-between gap-3">
          <View className="flex-1">
            <Text variant="title" className="text-role-guard">
              Visitor log
            </Text>
            <Text variant="body" tone="muted" className="mt-1">
              {societyName}
            </Text>
          </View>
          <Button
            label="Register"
            size="sm"
            variant="accent"
            icon={{ family: 'ionic', name: 'add-circle-outline' }}
            onPress={() => router.push(registerHref)}
          />
        </View>

        <View className="mb-4 flex-row flex-wrap gap-2">
          {FILTERS.map((chip) => {
            const active = filter === chip.id;
            return (
              <Pressable
                key={chip.id}
                onPress={() => setFilter(chip.id)}
                className={`rounded-full border px-3 py-1.5 ${
                  active
                    ? 'border-role-guard bg-role-guard/15'
                    : 'border-border bg-card'
                }`}
              >
                <Text
                  variant="caption"
                  className={active ? 'text-role-guard' : undefined}
                  tone={active ? undefined : 'muted'}
                >
                  {chip.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {visitorsQuery.isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : visitorsQuery.isError ? (
          <View className="flex-1 items-center justify-center px-4">
            <Icon
              family="ionic"
              name="alert-circle-outline"
              size={40}
              color={colors.danger}
            />
            <Text variant="body" tone="muted" className="mt-3 text-center">
              {visitorsQuery.error instanceof Error
                ? visitorsQuery.error.message
                : 'Could not load visitors'}
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
            data={filtered}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingBottom: 24, flexGrow: 1 }}
            showsVerticalScrollIndicator={false}
            refreshing={visitorsQuery.isRefetching}
            onRefresh={() => void visitorsQuery.refetch()}
            ListEmptyComponent={
              <View className="flex-1 items-center justify-center px-6 py-16">
                <Icon
                  family="ionic"
                  name="people-outline"
                  size={44}
                  color={colors.muted}
                />
                <Text variant="label" className="mt-3 text-center">
                  {filter === 'all' ? 'No visitors yet' : 'Nothing in this filter'}
                </Text>
                <Text variant="body" tone="muted" className="mt-1 text-center">
                  {filter === 'all'
                    ? 'Register a visitor at the gate to start the log.'
                    : 'Try another filter or register a new visitor.'}
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

      <DashboardBottomNav
        role="guard"
        roleAccent={colors.roleGuard}
        activeTab="visitors"
      />
    </View>
  );
}
