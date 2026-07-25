import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GuestQrCard } from '@/components/visitors/guest-qr-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Text } from '@/components/ui/text';
import { VisitorDetailContent } from '@/components/visitors/visitor-detail-content';
import { VisitorFlowHeader } from '@/components/visitors/visitor-flow-header';
import { useMyMemberships } from '@/hooks/use-society';
import {
  useAttachQrToPreApproval,
  useVisitorRequest,
} from '@/hooks/use-visitors';
import { capitalizeVisitorValue } from '@/lib/visitor-status';
import { useThemeColors } from '@/lib/theme-colors';
import { remainingScans } from '@/lib/visitor-qr';

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
  const scansLeft = preview ? remainingScans(preview) : 0;

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
      <View
        className="flex-1 bg-background px-6 justify-center"
        style={{ paddingTop: insets.top + 16 }}
      >
        <VisitorFlowHeader role="resident" title="Pre-approval" showBack />
        <Text variant="body" tone="muted" className="mt-2">
          {visitorQuery.isError
            ? visitorQuery.error instanceof Error
              ? visitorQuery.error.message
              : 'Could not load this pre-approval'
            : 'Pre-approval not found for your flat.'}
        </Text>
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
      <VisitorFlowHeader
        role="resident"
        title="Pre-approval"
        subtitle={`${capitalizeVisitorValue(preview.visitor_type)} pass for ${preview.visitor_name}`}
        showBack
        backLabel="Back"
      />

      <View className="mt-2 flex-row flex-wrap gap-2">
        {scansLeft === 0 ? (
          <Badge tone="danger" label="Used up" />
        ) : (
          <Badge tone="success" label="Active" />
        )}
        {preview.max_scans > 1 ? (
          <Badge
            tone={scansLeft === 0 ? 'muted' : 'success'}
            label={`${preview.scan_count}/${preview.max_scans} entries`}
          />
        ) : null}
        {preview.qr_token ? <Badge tone="pending" label="QR ready" /> : null}
      </View>

      <View className="mt-4">
        <VisitorDetailContent visitor={preview} variant="compact" />
      </View>

      {preview.qr_token ? (
        <View className="mt-6">
          <GuestQrCard visitor={preview} />
        </View>
      ) : (
        <View className="mt-6 rounded-2xl border border-border bg-card px-4 py-4">
          <Text variant="label">No QR yet</Text>
          <Text variant="body" tone="muted" className="mt-2">
            Saved for the gate — guard can admit from the pre-approved list using
            name{preview.photo_url ? ' and photo' : ''}.
          </Text>
          <Text variant="caption" tone="muted" className="mt-2">
            Generate a QR when sharing with a known guest.
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
        label="All pre-approvals"
        fullWidth
        variant="outline"
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
