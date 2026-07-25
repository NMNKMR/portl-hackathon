import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { ScreenBackButton } from '@/components/ui/screen-back-button';
import { Text } from '@/components/ui/text';
import {
  useComplaint,
  useUpdateComplaintStatus,
} from '@/hooks/use-complaints';
import { useMyMemberships } from '@/hooks/use-society';
import {
  complaintCategoryLabel,
  complaintFlatLabel,
  complaintStatusBadge,
} from '@/lib/api/complaints';
import { formatJoinDate } from '@/lib/format';
import { useThemeColors } from '@/lib/theme-colors';
import type { ComplaintStatus } from '@/types/database';

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: 'home-outline' | 'time-outline' | 'pricetag-outline' | 'checkmark-done-outline';
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

export default function AdminComplaintDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const params = useLocalSearchParams<{ id?: string; societyId?: string }>();
  const complaintId = typeof params.id === 'string' ? params.id : undefined;

  const memberships = useMyMemberships();
  const membership = useMemo(() => {
    const rows = memberships.data ?? [];
    if (params.societyId) {
      return rows.find(
        (m) =>
          m.society_id === params.societyId &&
          m.role === 'admin' &&
          m.status === 'approved',
      );
    }
    return rows.find((m) => m.role === 'admin' && m.status === 'approved');
  }, [memberships.data, params.societyId]);

  const complaintQuery = useComplaint(complaintId);
  const complaint = complaintQuery.data;
  const updateStatus = useUpdateComplaintStatus();
  const [error, setError] = useState<string | null>(null);

  const setStatus = async (status: ComplaintStatus) => {
    if (!complaint) return;
    setError(null);
    try {
      await updateStatus.mutateAsync({ id: complaint.id, status });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed');
    }
  };

  if (memberships.isLoading || complaintQuery.isLoading) {
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
        <Text variant="title" className="text-role-admin">
          Complaint
        </Text>
        <Text variant="body" tone="muted" className="mt-2">
          No approved admin membership.
        </Text>
        <ScreenBackButton className="mt-6" />
      </View>
    );
  }

  if (complaintQuery.isError) {
    return (
      <View
        className="flex-1 justify-center bg-background px-6"
        style={{ paddingBottom: insets.bottom + 16 }}
      >
        <Text variant="title">Complaint</Text>
        <Text variant="caption" tone="danger" className="mt-2">
          {complaintQuery.error instanceof Error
            ? complaintQuery.error.message
            : 'Could not load this complaint'}
        </Text>
        <ScreenBackButton className="mt-6" />
      </View>
    );
  }

  if (!complaint) {
    return (
      <View
        className="flex-1 justify-center bg-background px-6"
        style={{ paddingBottom: insets.bottom + 16 }}
      >
        <Text variant="title">Complaint not found</Text>
        <Text variant="body" tone="muted" className="mt-2">
          This complaint may have been removed or you no longer have access.
        </Text>
        <ScreenBackButton
          className="mt-6"
          label="Back to complaints"
          onPress={() => {
            const href = membership.society_id
              ? ({
                  pathname: '/(admin)/complaints',
                  params: { societyId: membership.society_id },
                } as Href)
              : ('/(admin)/complaints' as Href);
            router.replace(href);
          }}
        />
      </View>
    );
  }

  const badge = complaintStatusBadge(complaint.status);
  const showActions =
    complaint.status === 'open' ||
    complaint.status === 'in_progress' ||
    complaint.status === 'resolved';

  return (
    <View
      className="flex-1 bg-background"
      style={{ paddingTop: insets.top + 8 }}
    >
      <View className="px-5">
        <ScreenBackButton className="mb-2" />
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: insets.bottom + (showActions ? 120 : 32),
        }}
      >
        <View className="items-center">
          {complaint.photo_url ? (
            <Image
              source={{ uri: complaint.photo_url }}
              style={{ width: '100%', maxWidth: 320, height: 220, borderRadius: 16 }}
              contentFit="cover"
              accessibilityLabel="Complaint photo"
            />
          ) : (
            <View className="h-44 w-full max-w-xs items-center justify-center rounded-2xl bg-primary/10">
              <Icon
                family="ionic"
                name="construct-outline"
                size={48}
                color={colors.primary}
              />
            </View>
          )}

          <Text variant="title" className="mt-4 text-center text-role-admin">
            {complaintCategoryLabel(complaint.category)}
          </Text>
          <View className="mt-2">
            <Badge tone={badge.tone} label={badge.label} />
          </View>
        </View>

        {complaint.description ? (
          <Text variant="body" className="mt-6">
            {complaint.description}
          </Text>
        ) : null}

        <View className="mt-6 rounded-xl border border-border bg-card px-4">
          <DetailRow
            icon="home-outline"
            label="Flat"
            value={complaintFlatLabel(complaint)}
          />
          <DetailRow
            icon="pricetag-outline"
            label="Category"
            value={complaintCategoryLabel(complaint.category)}
          />
          <DetailRow
            icon="time-outline"
            label="Raised"
            value={formatJoinDate(complaint.created_at) || '—'}
          />
          {complaint.resolved_at ? (
            <DetailRow
              icon="checkmark-done-outline"
              label="Resolved"
              value={formatJoinDate(complaint.resolved_at) || '—'}
            />
          ) : null}
        </View>

        {error ? (
          <Text variant="caption" tone="danger" className="mt-4 text-center">
            {error}
          </Text>
        ) : null}
      </ScrollView>

      {showActions ? (
        <View
          className="absolute bottom-0 left-0 right-0 border-t border-border bg-card px-5 pt-3"
          style={{ paddingBottom: Math.max(insets.bottom, 16) }}
        >
          <View className="flex-row flex-wrap gap-2">
            {complaint.status === 'open' ? (
              <Button
                label="Start"
                variant="outline"
                loading={updateStatus.isPending}
                onPress={() => void setStatus('in_progress')}
              />
            ) : null}
            {complaint.status === 'open' || complaint.status === 'in_progress' ? (
              <Button
                label="Resolve"
                variant="accent"
                loading={updateStatus.isPending}
                onPress={() => void setStatus('resolved')}
              />
            ) : null}
            {complaint.status === 'resolved' ? (
              <Button
                label="Reopen"
                variant="ghost"
                loading={updateStatus.isPending}
                onPress={() => void setStatus('open')}
              />
            ) : null}
          </View>
        </View>
      ) : null}
    </View>
  );
}
