import { useRouter, type Href } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DashboardBottomNav } from '@/components/dashboard-bottom-nav';
import { Button } from '@/components/ui/button';
import { AppBottomSheet } from '@/components/ui/bottom-sheet';
import { Badge } from '@/components/ui/badge';
import { Text } from '@/components/ui/text';
import { VisitorRequestCard } from '@/components/visitors/visitor-request-card';
import { useAdminSocietyId } from '@/hooks/use-admin-society-id';
import { useSociety } from '@/hooks/use-society';
import {
  useSocietyVisitors,
  useVisitorRealtime,
} from '@/hooks/use-visitors';
import {
  visitorFlatLabel,
  type VisitorRequest,
} from '@/lib/api/visitors';
import { formatJoinDate } from '@/lib/format';
import { useThemeColors } from '@/lib/theme-colors';
import type { VisitorStatus } from '@/types/database';

type BadgeTone = 'pending' | 'success' | 'danger' | 'muted';

const STATUS_BADGE: Record<
  VisitorStatus,
  { tone: BadgeTone; label: string }
> = {
  pending: { tone: 'pending', label: 'Pending' },
  approved: { tone: 'success', label: 'Approved' },
  rejected: { tone: 'danger', label: 'Rejected' },
  checked_in: { tone: 'success', label: 'Checked in' },
  checked_out: { tone: 'muted', label: 'Checked out' },
};

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="mb-3">
      <Text variant="caption" tone="muted">
        {label}
      </Text>
      <Text variant="body" className="mt-0.5">
        {value}
      </Text>
    </View>
  );
}

export default function AdminVisitorsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const { societyId, isLoading: societyIdLoading } = useAdminSocietyId();
  const society = useSociety(societyId);
  const visitors = useSocietyVisitors(societyId);
  useVisitorRealtime({ societyId, enabled: Boolean(societyId) });

  const [selected, setSelected] = useState<VisitorRequest | null>(null);
  const rows = visitors.data ?? [];
  const societyName = society.data?.name ?? 'Your society';

  const subtitle = useMemo(() => {
    if (visitors.isLoading) return 'Loading log…';
    return `${rows.length} visitor${rows.length === 1 ? '' : 's'} · ${societyName}`;
  }, [rows.length, societyName, visitors.isLoading]);

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
        <Text variant="title" className="text-role-admin">
          Visitors
        </Text>
        <Text variant="body" tone="muted" className="mt-1">
          {subtitle}
        </Text>
        <Text variant="caption" tone="muted" className="mt-1">
          Society-wide log · read only
        </Text>

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
            className="mt-6"
            data={rows}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            refreshing={visitors.isRefetching}
            onRefresh={() => void visitors.refetch()}
            contentContainerStyle={{
              paddingBottom: 24,
              flexGrow: 1,
            }}
            ListEmptyComponent={
              <View className="flex-1 items-center justify-center py-16">
                <Text variant="body" tone="muted" className="text-center">
                  No visitor requests yet.
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

      <DashboardBottomNav
        role="admin"
        roleAccent={colors.roleAdmin}
        activeTab="visitors"
      />

      <AppBottomSheet
        visible={selected != null}
        onClose={() => setSelected(null)}
        title={selected?.visitor_name.trim() || 'Visitor'}
        snapPoints={['45%', '70%']}
      >
        {selected ? (
          <View className="px-1 pb-4">
            <View className="mb-4 flex-row items-center justify-between gap-2">
              <Text variant="caption" tone="muted">
                {capitalize(selected.visitor_type)} ·{' '}
                {visitorFlatLabel(selected)}
              </Text>
              <Badge
                tone={STATUS_BADGE[selected.status].tone}
                label={STATUS_BADGE[selected.status].label}
              />
            </View>

            {selected.visitor_phone ? (
              <DetailRow label="Phone" value={selected.visitor_phone} />
            ) : null}
            {selected.vehicle_number ? (
              <DetailRow
                label="Vehicle"
                value={[
                  selected.vehicle_number,
                  selected.vehicle_type
                    ? `(${capitalize(selected.vehicle_type)})`
                    : null,
                ]
                  .filter(Boolean)
                  .join(' ')}
              />
            ) : null}
            <DetailRow
              label="Requested"
              value={formatJoinDate(selected.requested_at) || '—'}
            />
            {selected.approved_at ? (
              <DetailRow
                label="Responded"
                value={formatJoinDate(selected.approved_at) || '—'}
              />
            ) : null}
            {selected.checked_in_at ? (
              <DetailRow
                label="Checked in"
                value={formatJoinDate(selected.checked_in_at) || '—'}
              />
            ) : null}
            {selected.checked_out_at ? (
              <DetailRow
                label="Checked out"
                value={formatJoinDate(selected.checked_out_at) || '—'}
              />
            ) : null}
            <DetailRow
              label="Initiated by"
              value={capitalize(selected.initiated_by)}
            />
          </View>
        ) : null}
      </AppBottomSheet>
    </View>
  );
}
