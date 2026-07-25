import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ComplaintFormSheet } from '@/components/complaints/complaint-form-sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { ScreenBackButton } from '@/components/ui/screen-back-button';
import { Text } from '@/components/ui/text';
import { useComplaint } from '@/hooks/use-complaints';
import { useMyMemberships } from '@/hooks/use-society';
import {
  complaintCategoryLabel,
  complaintFlatLabel,
  complaintStatusBadge,
} from '@/lib/api/complaints';
import { formatJoinDate } from '@/lib/format';
import { useThemeColors } from '@/lib/theme-colors';

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

export default function ResidentComplaintDetailScreen() {
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
          m.role === 'resident' &&
          m.status === 'approved',
      );
    }
    return rows.find((m) => m.role === 'resident' && m.status === 'approved');
  }, [memberships.data, params.societyId]);

  const complaintQuery = useComplaint(complaintId);
  const complaint = complaintQuery.data;
  const [editOpen, setEditOpen] = useState(false);
  const canEdit =
    Boolean(complaint && membership) &&
    complaint?.raised_by_membership_id === membership?.id &&
    complaint?.status === 'open';

  if (memberships.isLoading || complaintQuery.isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!membership?.flat_id) {
    return (
      <View
        className="flex-1 justify-center bg-background px-6"
        style={{ paddingBottom: insets.bottom + 16 }}
      >
        <Text variant="title" className="text-role-resident">
          Complaint
        </Text>
        <Text variant="body" tone="muted" className="mt-2">
          No approved resident flat.
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
                  pathname: '/(resident)/complaints',
                  params: { societyId: membership.society_id },
                } as Href)
              : ('/(resident)/complaints' as Href);
            router.replace(href);
          }}
        />
      </View>
    );
  }

  const badge = complaintStatusBadge(complaint.status);

  return (
    <View
      className="flex-1 bg-background"
      style={{ paddingTop: insets.top + 8 }}
    >
      <View className="px-5">
        <View className="mb-2 flex-row items-center justify-between gap-3">
          <ScreenBackButton />
          {canEdit && complaint && membership?.society_id ? (
            <Button
              label="Edit"
              size="sm"
              variant="outline"
              onPress={() => setEditOpen(true)}
            />
          ) : null}
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: insets.bottom + 32,
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

          <Text variant="title" className="mt-4 text-center text-role-resident">
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
      </ScrollView>

      {canEdit && complaint && membership?.society_id ? (
        <ComplaintFormSheet
          visible={editOpen}
          onClose={() => setEditOpen(false)}
          complaint={complaint}
          societyId={membership.society_id}
        />
      ) : null}
    </View>
  );
}
