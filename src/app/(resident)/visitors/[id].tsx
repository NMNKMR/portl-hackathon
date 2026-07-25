import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { useMemo } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { VisitorDetailContent } from '@/components/visitors/visitor-detail-content';
import { VisitorFlowHeader } from '@/components/visitors/visitor-flow-header';
import { useMyMemberships } from '@/hooks/use-society';
import {
  useRespondToVisitor,
  useVisitorRealtime,
  useVisitorRequest,
} from '@/hooks/use-visitors';
import { visitorStatusLabel } from '@/lib/visitor-status';
import { useThemeColors } from '@/lib/theme-colors';

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
        <VisitorFlowHeader role="resident" title="Visitor" showBack />
        <Text variant="body" tone="muted" className="mt-2">
          No approved resident membership found.
        </Text>
      </View>
    );
  }

  if (visitorQuery.isError) {
    return (
      <View
        className="flex-1 justify-center bg-background px-6"
        style={{ paddingTop: insets.top + 16, paddingBottom: insets.bottom + 16 }}
      >
        <VisitorFlowHeader role="resident" title="Visitor" showBack />
        <Text variant="caption" tone="danger" className="mt-2">
          {visitorQuery.error instanceof Error
            ? visitorQuery.error.message
            : 'Could not load this visitor request'}
        </Text>
      </View>
    );
  }

  if (!visitor) {
    return (
      <View
        className="flex-1 justify-center bg-background px-6"
        style={{ paddingTop: insets.top + 16, paddingBottom: insets.bottom + 16 }}
      >
        <VisitorFlowHeader
          role="resident"
          title="Visitor not found"
          showBack
          backLabel="Back to visitors"
          onBack={() => {
            const href = membership.society_id
              ? (`/(resident)/visitors?societyId=${encodeURIComponent(membership.society_id)}` as Href)
              : ('/(resident)/visitors' as Href);
            router.replace(href);
          }}
        />
        <Text variant="body" tone="muted" className="mt-2">
          This request may have been removed or you no longer have access.
        </Text>
      </View>
    );
  }

  return (
    <View
      className="flex-1 bg-background"
      style={{ paddingTop: insets.top + 8 }}
    >
      <View className="px-5">
        <VisitorFlowHeader
          role="resident"
          title="Visitor approval"
          showBack
          backLabel="Back"
        />
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: insets.bottom + (isPending ? 120 : 32),
        }}
      >
        <VisitorDetailContent visitor={visitor} variant="banner" />

        {!isPending ? (
          <View className="mt-6 rounded-2xl border border-border bg-card px-4 py-3">
            <Text variant="body" tone="muted" className="text-center">
              This request is {visitorStatusLabel(visitor.status).toLowerCase()}.
            </Text>
          </View>
        ) : null}
      </ScrollView>

      {isPending ? (
        <View
          className="absolute bottom-0 left-0 right-0 border-t border-border bg-card px-5 pt-3"
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
