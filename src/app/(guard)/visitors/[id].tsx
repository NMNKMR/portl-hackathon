import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { VisitorDetailContent } from '@/components/visitors/visitor-detail-content';
import { VisitorFlowHeader } from '@/components/visitors/visitor-flow-header';
import {
  useAdmitVisitorEntry,
  useCheckOutVisitor,
  useVisitorRealtime,
  useVisitorRequest,
} from '@/hooks/use-visitors';
import { hasQrPass } from '@/lib/api/visitors';
import { remainingScans } from '@/lib/visitor-qr';
import { useThemeColors } from '@/lib/theme-colors';

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

  const showFooter = useMemo(() => {
    if (!visitor) return false;
    return (
      (visitor.status === 'approved' && hasQrPass(visitor)) ||
      (visitor.status === 'approved' && !hasQrPass(visitor)) ||
      visitor.status === 'checked_in'
    );
  }, [visitor]);

  const handleAdmit = async () => {
    if (!id || !visitor) return;
    setActionError(null);
    try {
      if (hasQrPass(visitor)) {
        setActionError('QR pass — use Scan QR to grant entry');
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
        style={{ paddingTop: insets.top + 16 }}
      >
        <VisitorFlowHeader
          role="guard"
          title="Visitor"
          showBack
          backLabel="Back to log"
          onBack={() => router.replace('/(guard)/visitors' as Href)}
        />
        <Text variant="body" tone="muted" className="mt-2">
          {visitorQuery.error instanceof Error
            ? visitorQuery.error.message
            : 'Visitor not found'}
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top + 8 }}>
      <View className="px-5">
        <VisitorFlowHeader
          role="guard"
          title="Visitor details"
          showBack
          backLabel="Back to log"
        />
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: insets.bottom + (showFooter ? 120 : 24),
        }}
        showsVerticalScrollIndicator={false}
      >
        <VisitorDetailContent visitor={visitor} variant="banner" />

        {visitor.status === 'pending' ? (
          <View className="mt-6 rounded-2xl border border-accent/30 bg-accent/10 px-4 py-3">
            <Text variant="body" tone="muted">
              Waiting for resident approval before entry.
            </Text>
          </View>
        ) : null}

        {actionError && !showFooter ? (
          <Text variant="caption" tone="danger" className="mt-4">
            {actionError}
          </Text>
        ) : null}
      </ScrollView>

      {showFooter ? (
        <View
          className="absolute bottom-0 left-0 right-0 border-t border-border bg-card px-5 pt-3"
          style={{ paddingBottom: Math.max(insets.bottom, 16) }}
        >
          {actionError ? (
            <Text variant="caption" tone="danger" className="mb-2">
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
        </View>
      ) : null}
    </View>
  );
}
