import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { useMemo } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { useMyMemberships } from '@/hooks/use-society';
import {
  useRespondToVisitor,
  useVisitorRealtime,
  useVisitorRequest,
} from '@/hooks/use-visitors';
import { visitorFlatLabel } from '@/lib/api/visitors';
import { formatJoinDate } from '@/lib/format';
import { formatPhoneDisplay } from '@/lib/phone';
import { useThemeColors } from '@/lib/theme-colors';
import type { VisitorStatus } from '@/types/database';

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1).replace(/_/g, ' ');
}

function statusBadgeTone(
  status: VisitorStatus,
): 'pending' | 'success' | 'danger' | 'muted' {
  if (status === 'pending') return 'pending';
  if (status === 'rejected') return 'danger';
  if (status === 'approved' || status === 'checked_in') return 'success';
  return 'muted';
}

function statusLabel(status: VisitorStatus) {
  if (status === 'checked_in') return 'Checked in';
  if (status === 'checked_out') return 'Checked out';
  return capitalize(status);
}

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: 'call-outline' | 'car-outline' | 'home-outline' | 'time-outline' | 'pricetag-outline';
  label: string;
  value: string;
}) {
  const colors = useThemeColors();
  return (
    <View className="flex-row items-start gap-3 border-b border-border py-3">
      <Icon family="ionic" name={icon} size={20} color={colors.muted} />
      <View className="min-w-0 flex-1">
        <Text variant="caption" tone="muted">
          {label}
        </Text>
        <Text variant="body" className="mt-0.5">
          {value}
        </Text>
      </View>
    </View>
  );
}

export default function ResidentVisitorDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const params = useLocalSearchParams<{ id?: string; societyId?: string }>();
  const visitorId = typeof params.id === 'string' ? params.id : undefined;

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

  const visitorQuery = useVisitorRequest(visitorId);
  const visitor = visitorQuery.data;
  useVisitorRealtime({
    flatId: membership?.flat_id ?? visitor?.flat_id,
    enabled: Boolean(membership?.flat_id ?? visitor?.flat_id),
  });

  const respond = useRespondToVisitor();
  const isPending = visitor?.status === 'pending';
  const isApproving =
    respond.isPending && respond.variables?.status === 'approved';
  const isRejecting =
    respond.isPending && respond.variables?.status === 'rejected';

  const handleRespond = async (status: 'approved' | 'rejected') => {
    if (!visitor || !membership) return;
    try {
      await respond.mutateAsync({
        id: visitor.id,
        status,
        membershipId: membership.id,
      });
      Alert.alert(
        status === 'approved' ? 'Visitor approved' : 'Visitor rejected',
        status === 'approved'
          ? `${visitor.visitor_name} can now enter.`
          : `${visitor.visitor_name} was rejected.`,
      );
    } catch (error) {
      Alert.alert(
        'Could not update',
        error instanceof Error ? error.message : 'Please try again.',
      );
    }
  };

  if (memberships.isLoading || visitorQuery.isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!membership) {
    return (
      <View
        className="flex-1 justify-center bg-background px-6"
        style={{ paddingBottom: insets.bottom + 16 }}
      >
        <Text variant="title">Visitor</Text>
        <Text variant="body" tone="muted" className="mt-2">
          No approved resident membership found.
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

  if (visitorQuery.isError) {
    return (
      <View
        className="flex-1 justify-center bg-background px-6"
        style={{ paddingBottom: insets.bottom + 16 }}
      >
        <Text variant="title">Visitor</Text>
        <Text variant="caption" tone="danger" className="mt-2">
          {visitorQuery.error instanceof Error
            ? visitorQuery.error.message
            : 'Could not load this visitor request'}
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

  if (!visitor) {
    return (
      <View
        className="flex-1 justify-center bg-background px-6"
        style={{ paddingBottom: insets.bottom + 16 }}
      >
        <Text variant="title">Visitor not found</Text>
        <Text variant="body" tone="muted" className="mt-2">
          This request may have been removed or you no longer have access.
        </Text>
        <Button
          className="mt-6"
          label="Back to visitors"
          fullWidth
          onPress={() => {
            const href = membership.society_id
              ? (`/(resident)/visitors?societyId=${encodeURIComponent(membership.society_id)}` as Href)
              : ('/(resident)/visitors' as Href);
            router.replace(href);
          }}
        />
      </View>
    );
  }

  const vehicleLine = [
    visitor.vehicle_number?.trim(),
    visitor.vehicle_type && visitor.vehicle_type !== 'none'
      ? capitalize(visitor.vehicle_type)
      : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <View
      className="flex-1 bg-background"
      style={{ paddingTop: insets.top + 8 }}
    >
      <View className="px-6">
        <Button
          label="Back"
          variant="ghost"
          className="mb-2 self-start px-0"
          onPress={() => router.back()}
        />
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingBottom: insets.bottom + (isPending ? 120 : 32),
        }}
      >
        <View className="items-center">
          {visitor.photo_url ? (
            <Image
              source={{ uri: visitor.photo_url }}
              style={{ width: 144, height: 144, borderRadius: 16 }}
              contentFit="cover"
              accessibilityLabel={`${visitor.visitor_name} photo`}
            />
          ) : (
            <View className="h-36 w-36 items-center justify-center rounded-2xl bg-primary/10">
              <Icon
                family="ionic"
                name="person-outline"
                size={48}
                color={colors.primary}
              />
            </View>
          )}

          <Text variant="title" className="mt-4 text-center">
            {visitor.visitor_name}
          </Text>
          <View className="mt-2">
            <Badge
              tone={statusBadgeTone(visitor.status)}
              label={statusLabel(visitor.status)}
            />
          </View>
        </View>

        <View className="mt-6 rounded-xl border border-border bg-card px-4">
          <DetailRow
            icon="pricetag-outline"
            label="Type"
            value={capitalize(visitor.visitor_type)}
          />
          <DetailRow
            icon="call-outline"
            label="Phone"
            value={
              visitor.visitor_phone
                ? formatPhoneDisplay(visitor.visitor_phone)
                : 'Not provided'
            }
          />
          <DetailRow
            icon="car-outline"
            label="Vehicle"
            value={vehicleLine || 'None'}
          />
          <DetailRow
            icon="time-outline"
            label="Requested"
            value={formatJoinDate(visitor.requested_at) || '—'}
          />
          <DetailRow
            icon="home-outline"
            label="Flat"
            value={visitorFlatLabel(visitor)}
          />
        </View>

        {!isPending ? (
          <Text variant="body" tone="muted" className="mt-6 text-center">
            This request is {statusLabel(visitor.status).toLowerCase()}.
          </Text>
        ) : null}
      </ScrollView>

      {isPending ? (
        <View
          className="absolute bottom-0 left-0 right-0 border-t border-border bg-card px-6 pt-3"
          style={{ paddingBottom: Math.max(insets.bottom, 16) }}
        >
          <View className="flex-row gap-3">
            <Button
              style={{ flex: 1 }}
              variant="accent"
              label="Approve"
              loading={isApproving}
              disabled={isRejecting}
              onPress={() => void handleRespond('approved')}
            />
            <Button
              style={{ flex: 1 }}
              variant="outlineDanger"
              label="Reject"
              loading={isRejecting}
              disabled={isApproving}
              onPress={() => void handleRespond('rejected')}
            />
          </View>
        </View>
      ) : null}
    </View>
  );
}
