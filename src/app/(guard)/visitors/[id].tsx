import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import {
  useAdmitVisitorEntry,
  useCheckOutVisitor,
  useVisitorRealtime,
  useVisitorRequest,
} from '@/hooks/use-visitors';
import { hasQrPass, visitorFlatLabel } from '@/lib/api/visitors';
import { formatJoinDate } from '@/lib/format';
import { useThemeColors } from '@/lib/theme-colors';
import { remainingScans } from '@/lib/visitor-qr';
import type { VisitorStatus } from '@/types/database';

function statusBadge(status: VisitorStatus): {
  tone: 'pending' | 'success' | 'danger' | 'muted';
  label: string;
} {
  switch (status) {
    case 'pending':
      return { tone: 'pending', label: 'Pending' };
    case 'approved':
      return { tone: 'success', label: 'Approved' };
    case 'rejected':
      return { tone: 'danger', label: 'Rejected' };
    case 'checked_in':
      return { tone: 'success', label: 'Inside' };
    case 'checked_out':
      return { tone: 'muted', label: 'Checked out' };
    default:
      return { tone: 'muted', label: status };
  }
}

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

export default function GuardVisitorDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const params = useLocalSearchParams<{ id?: string }>();
  const id = typeof params.id === 'string' ? params.id : undefined;

  const visitorQuery = useVisitorRequest(id);
  const admit = useAdmitVisitorEntry();
  const checkOut = useCheckOutVisitor();
  const [actionError, setActionError] = useState<string | null>(null);

  const visitor = visitorQuery.data;
  useVisitorRealtime({
    societyId: visitor?.society_id,
    enabled: Boolean(visitor?.society_id),
  });

  const badge = useMemo(
    () => (visitor ? statusBadge(visitor.status) : null),
    [visitor],
  );

  const handleAdmit = async () => {
    if (!id || !visitor) return;
    setActionError(null);
    try {
      if (hasQrPass(visitor)) {
        setActionError('QR available — open Scan QR to grant entry');
        return;
      }
      await admit.mutateAsync({ id, requireNoQr: true });
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : 'Could not admit visitor',
      );
    }
  };

  const handleCheckOut = async () => {
    if (!id) return;
    setActionError(null);
    try {
      await checkOut.mutateAsync(id);
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : 'Could not check out visitor',
      );
    }
  };

  if (visitorQuery.isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (visitorQuery.isError || !visitor) {
    return (
      <View
        className="flex-1 bg-background px-5 justify-center"
        style={{ paddingTop: insets.top }}
      >
        <Text variant="title" className="text-role-guard">
          Visitor
        </Text>
        <Text variant="body" tone="muted" className="mt-2">
          {visitorQuery.error instanceof Error
            ? visitorQuery.error.message
            : 'Visitor not found'}
        </Text>
        <Button
          className="mt-6"
          label="Back to log"
          fullWidth
          onPress={() => router.replace('/(guard)/visitors' as Href)}
        />
      </View>
    );
  }

  const vehicleLine =
    visitor.vehicle_type && visitor.vehicle_type !== 'none'
      ? [
          capitalize(visitor.vehicle_type),
          visitor.vehicle_number?.trim() || null,
        ]
          .filter(Boolean)
          .join(' · ')
      : visitor.vehicle_number?.trim() || '—';

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 12,
          paddingBottom: Math.max(insets.bottom, 24) + 16,
        }}
        showsVerticalScrollIndicator={false}
      >
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
            <Text variant="title" className="text-role-guard">
              {visitor.visitor_name}
            </Text>
            <Text variant="body" tone="muted" className="mt-1">
              {capitalize(visitor.visitor_type)} · {visitorFlatLabel(visitor)}
            </Text>
          </View>
          {badge ? <Badge tone={badge.tone} label={badge.label} /> : null}
        </View>

        <View className="mb-5 h-48 overflow-hidden rounded-xl border border-border bg-card">
          {visitor.photo_url ? (
            <Image
              source={{ uri: visitor.photo_url }}
              className="h-full w-full"
              resizeMode="cover"
            />
          ) : (
            <View className="flex-1 items-center justify-center">
              <Icon
                family="ionic"
                name="person-outline"
                size={40}
                color={colors.muted}
              />
              <Text variant="caption" tone="muted" className="mt-2">
                No photo
              </Text>
            </View>
          )}
        </View>

        <DetailRow label="Phone" value={visitor.visitor_phone?.trim() || '—'} />
        <DetailRow label="Vehicle" value={vehicleLine} />
        <DetailRow
          label="Requested"
          value={formatJoinDate(visitor.requested_at) || '—'}
        />
        {visitor.approved_at ? (
          <DetailRow
            label="Approved"
            value={formatJoinDate(visitor.approved_at) || '—'}
          />
        ) : null}
        {visitor.checked_in_at ? (
          <DetailRow
            label="Checked in"
            value={formatJoinDate(visitor.checked_in_at) || '—'}
          />
        ) : null}
        {visitor.checked_out_at ? (
          <DetailRow
            label="Checked out"
            value={formatJoinDate(visitor.checked_out_at) || '—'}
          />
        ) : null}
        {visitor.initiated_by === 'resident' ? (
          <DetailRow
            label="Entries"
            value={`${visitor.scan_count}/${visitor.max_scans} used · ${remainingScans(visitor)} left`}
          />
        ) : null}
        {hasQrPass(visitor) ? (
          <DetailRow label="Entry method" value="QR available — scan only" />
        ) : null}

        {actionError ? (
          <Text variant="caption" tone="danger" className="mb-3">
            {actionError}
          </Text>
        ) : null}

        {visitor.status === 'approved' && hasQrPass(visitor) ? (
          <Button
            label="Open Scan QR"
            fullWidth
            variant="accent"
            onPress={() =>
              router.push(
                `/(guard)/visitors/scan?societyId=${encodeURIComponent(visitor.society_id)}` as Href,
              )
            }
          />
        ) : null}

        {visitor.status === 'approved' && !hasQrPass(visitor) ? (
          <Button
            label={
              visitor.max_scans > 1
                ? `Admit entry (${remainingScans(visitor)} left)`
                : 'Check in'
            }
            fullWidth
            variant="primary"
            loading={admit.isPending}
            onPress={() => void handleAdmit()}
          />
        ) : null}

        {visitor.status === 'checked_in' ? (
          <Button
            label="Check out"
            fullWidth
            variant="accent"
            loading={checkOut.isPending}
            onPress={() => void handleCheckOut()}
          />
        ) : null}

        {visitor.status === 'pending' ? (
          <Text variant="body" tone="muted" className="mt-2">
            Waiting for resident approval.
          </Text>
        ) : null}
      </ScrollView>
    </View>
  );
}
