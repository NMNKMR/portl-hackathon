import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { useMemo } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { VisitorRequestCard } from '@/components/visitors/visitor-request-card';
import { useMyMemberships } from '@/hooks/use-society';
import { useFlatVisitors } from '@/hooks/use-visitors';
import { hasQrPass, type VisitorRequest } from '@/lib/api/visitors';
import { useThemeColors } from '@/lib/theme-colors';
import { remainingScans } from '@/lib/visitor-qr';

function isActivePreApproval(v: VisitorRequest): boolean {
  return (
    v.initiated_by === 'resident' &&
    v.status === 'approved' &&
    remainingScans(v) > 0
  );
}

export default function ResidentPreApprovalsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const params = useLocalSearchParams<{ societyId?: string }>();
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
  const visitors = useFlatVisitors(flatId);

  const rows = useMemo(() => {
    return (visitors.data ?? [])
      .filter((v) => v.initiated_by === 'resident')
      .sort(
        (a, b) =>
          new Date(b.requested_at).getTime() -
          new Date(a.requested_at).getTime(),
      );
  }, [visitors.data]);

  const activeCount = rows.filter(isActivePreApproval).length;

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
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      <View className="flex-1 px-5 pt-3">
        <Pressable
          onPress={() => router.back()}
          className="mb-3 flex-row items-center gap-1 self-start"
          hitSlop={8}
        >
          <Icon
            family="ionic"
            name="chevron-back"
            size={20}
            color={colors.primary}
          />
          <Text variant="label" tone="primary">
            Back
          </Text>
        </Pressable>

        <View className="mb-4 flex-row items-start justify-between gap-3">
          <View className="flex-1">
            <Text variant="title" className="text-role-resident">
              Pre-approvals
            </Text>
            <Text variant="body" tone="muted" className="mt-1">
              {activeCount} active · tap to view / share QR
            </Text>
          </View>
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
        </View>

        {visitors.isLoading ? (
          <ActivityIndicator color={colors.roleResident} />
        ) : (
          <FlatList
            data={rows}
            keyExtractor={(item) => item.id}
            refreshing={visitors.isRefetching}
            onRefresh={() => void visitors.refetch()}
            contentContainerStyle={{ paddingBottom: 24, flexGrow: 1 }}
            ListEmptyComponent={
              <View className="items-center py-16">
                <Text variant="body" tone="muted" className="text-center">
                  No pre-approvals yet.
                </Text>
              </View>
            }
            renderItem={({ item }) => (
              <VisitorRequestCard
                visitor={item}
                onPress={() =>
                  router.push(
                    `/(resident)/pre-approvals/${item.id}?societyId=${encodeURIComponent(membership.society_id)}` as Href,
                  )
                }
                trailing={
                  hasQrPass(item) ? (
                    <Badge tone="pending" label="QR" />
                  ) : null
                }
              />
            )}
          />
        )}
      </View>
    </View>
  );
}
