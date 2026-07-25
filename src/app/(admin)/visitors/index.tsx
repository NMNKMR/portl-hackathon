import { useRouter, type Href } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { AppBottomSheet } from '@/components/ui/bottom-sheet';
import { Text } from '@/components/ui/text';
import { VisitorDetailContent } from '@/components/visitors/visitor-detail-content';
import { VisitorDateFilterChips } from '@/components/visitors/visitor-date-filter-chips';
import { VisitorFlowHeader } from '@/components/visitors/visitor-flow-header';
import { VisitorRequestCard } from '@/components/visitors/visitor-request-card';
import { useAdminSocietyId } from '@/hooks/use-admin-society-id';
import { useSociety } from '@/hooks/use-society';
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

export default function AdminVisitorsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const { societyId, isLoading: societyIdLoading } = useAdminSocietyId();
  const society = useSociety(societyId);
  const visitors = useSocietyVisitors(societyId);
  useVisitorRealtime({ societyId, enabled: Boolean(societyId) });

  const [selected, setSelected] = useState<VisitorRequest | null>(null);
  const [dateRange, setDateRange] = useState<VisitorDateRange>('week');
  const rows = visitors.data ?? [];
  const filteredRows = useMemo(
    () => filterVisitorsByDate(rows, dateRange),
    [rows, dateRange],
  );
  const societyName = society.data?.name ?? 'Your society';

  const subtitle = useMemo(() => {
    if (visitors.isLoading) return 'Loading log…';
    return `${filteredRows.length} visitor${filteredRows.length === 1 ? '' : 's'} · ${societyName}`;
  }, [filteredRows.length, societyName, visitors.isLoading]);

  if (societyIdLoading || (societyId && society.isLoading)) {
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
          Visitors
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
    <View className="flex-1 bg-background">
      <View
        className="flex-1 px-5"
        style={{ paddingTop: insets.top + 16 }}
      >
        <VisitorFlowHeader
          role="admin"
          title="Visitors"
          subtitle={subtitle}
          caption="Society-wide log · read only"
        />

        <View className="mt-4">
          <VisitorDateFilterChips
            value={dateRange}
            onChange={setDateRange}
            activeContainerClassName="border-role-admin bg-role-admin/15"
            activeLabelClassName="text-role-admin"
          />
        </View>

        {visitors.isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : visitors.isError ? (
          <View className="mt-8 gap-2">
            <Text variant="caption" tone="danger">
              {visitors.error instanceof Error
                ? visitors.error.message
                : 'Could not load visitors'}
            </Text>
            <Button
              label="Retry"
              variant="outline"
              fullWidth
              onPress={() => void visitors.refetch()}
            />
          </View>
        ) : (
          <FlatList
            className="mt-4"
            data={filteredRows}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            refreshing={visitors.isRefetching}
            onRefresh={() => void visitors.refetch()}
            contentContainerStyle={{
              paddingBottom: 40,
              flexGrow: 1,
            }}
            ListEmptyComponent={
              <View className="flex-1 items-center justify-center py-16 px-4">
                <Text variant="label" className="text-center">
                  No visitors yet
                </Text>
                <Text variant="body" tone="muted" className="mt-1 text-center">
                  {dateRange === 'all'
                    ? 'Gate registrations and pre-approvals will appear here.'
                    : 'Nothing in this date range. Try a wider filter.'}
                </Text>
              </View>
            }
            renderItem={({ item }) => (
              <VisitorRequestCard
                visitor={item}
                onPress={() => setSelected(item)}
              />
            )}
          />
        )}
      </View>

      <AppBottomSheet
        visible={selected != null}
        onClose={() => setSelected(null)}
        title="Visitor details"
        snapPoints={['55%', '85%']}
      >
        {selected ? (
          <View className="px-1 pb-4">
            <VisitorDetailContent visitor={selected} variant="compact" />
          </View>
        ) : null}
      </AppBottomSheet>
    </View>
  );
}
