import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { useMemo } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GuestQrCard } from '@/components/visitors/guest-qr-card';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { useMyMemberships } from '@/hooks/use-society';
import {
  useAttachQrToPreApproval,
  useVisitorRequest,
} from '@/hooks/use-visitors';
import { useThemeColors } from '@/lib/theme-colors';
import { remainingScans } from '@/lib/visitor-qr';
import { useState } from 'react';

export default function ResidentPreApprovalDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const params = useLocalSearchParams<{ id?: string; societyId?: string }>();
  const id = typeof params.id === 'string' ? params.id : undefined;

  const memberships = useMyMemberships();
  const attachQr = useAttachQrToPreApproval();
  const visitorQuery = useVisitorRequest(id);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

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

  const preview = visitorQuery.data;
  const societyId = membership?.society_id;

  const generateQr = async () => {
    if (!preview) return;
    setSubmitting(true);
    setError(null);
    try {
      await attachQr.mutateAsync(preview.id);
      await visitorQuery.refetch();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not generate QR');
    } finally {
      setSubmitting(false);
    }
  };

  if (memberships.isLoading || visitorQuery.isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (
    !membership ||
    !preview ||
    preview.initiated_by !== 'resident' ||
    (membership.flat_id && preview.flat_id !== membership.flat_id)
  ) {
    return (
      <View className="flex-1 bg-background px-6 justify-center">
        <Text variant="title" className="text-role-resident">
          Pre-approval
        </Text>
        <Text variant="body" tone="muted" className="mt-2">
          {visitorQuery.isError
            ? visitorQuery.error instanceof Error
              ? visitorQuery.error.message
              : 'Could not load this pre-approval'
            : 'Pre-approval not found for your flat.'}
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

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerStyle={{
        paddingTop: insets.top + 12,
        paddingBottom: Math.max(insets.bottom, 24) + 16,
        paddingHorizontal: 20,
      }}
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

      <Text variant="title" className="text-role-resident">
        Pre-approval ready
      </Text>
      <Text variant="body" tone="muted" className="mt-1">
        {preview.visitor_name} · {preview.visitor_type}
        {preview.max_scans > 1
          ? ` · ${preview.scan_count}/${preview.max_scans} used`
          : ''}
      </Text>
      {remainingScans(preview) === 0 ? (
        <Text variant="caption" tone="danger" className="mt-1">
          Pass exhausted
        </Text>
      ) : null}

      {preview.qr_token ? (
        <View className="mt-6">
          <GuestQrCard visitor={preview} />
        </View>
      ) : (
        <View className="mt-6 rounded-2xl border border-border bg-card px-4 py-4">
          <Text variant="body">
            Saved for the gate. Guard can admit from the pre-approved list using
            name{preview.photo_url ? ' and photo' : ''}.
          </Text>
          <Text variant="caption" tone="muted" className="mt-2">
            Recommended: generate a QR when sharing with a known person.
          </Text>
          <Button
            className="mt-4"
            label="Generate QR"
            variant="accent"
            fullWidth
            loading={submitting}
            onPress={() => void generateQr()}
          />
        </View>
      )}

      {error ? (
        <Text variant="caption" tone="danger" className="mt-3">
          {error}
        </Text>
      ) : null}

      <Button
        className="mt-6"
        label="My pre-approvals"
        fullWidth
        onPress={() =>
          router.replace(
            (societyId
              ? `/(resident)/pre-approvals?societyId=${encodeURIComponent(societyId)}`
              : '/(resident)/pre-approvals') as Href,
          )
        }
      />
      <Button
        className="mt-2"
        label="Create another"
        variant="ghost"
        fullWidth
        onPress={() =>
          router.push(
            (societyId
              ? `/(resident)/pre-approvals/create?societyId=${encodeURIComponent(societyId)}`
              : '/(resident)/pre-approvals/create') as Href,
          )
        }
      />
    </ScrollView>
  );
}
