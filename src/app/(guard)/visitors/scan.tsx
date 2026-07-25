import { CameraView, useCameraPermissions } from 'expo-camera';
import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Pressable,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { TextInput } from '@/components/ui/text-input';
import { useMyMemberships } from '@/hooks/use-society';
import { useAdmitVisitorEntry } from '@/hooks/use-visitors';
import { fetchVisitorByQrToken, visitorFlatLabel } from '@/lib/api/visitors';
import { useThemeColors } from '@/lib/theme-colors';
import { parseQrPayload, remainingScans } from '@/lib/visitor-qr';

export default function GuardScanVisitorScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const params = useLocalSearchParams<{ societyId?: string }>();
  const [permission, requestPermission] = useCameraPermissions();

  const memberships = useMyMemberships();
  const admit = useAdmitVisitorEntry();

  const membership = useMemo(() => {
    const rows = memberships.data ?? [];
    if (params.societyId) {
      return rows.find(
        (m) =>
          m.society_id === params.societyId &&
          m.role === 'guard' &&
          m.status === 'approved',
      );
    }
    return rows.find((m) => m.role === 'guard' && m.status === 'approved');
  }, [memberships.data, params.societyId]);

  const [locked, setLocked] = useState(false);
  const [manual, setManual] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handlePayload = async (raw: string) => {
    if (locked) return;
    setLocked(true);
    setError(null);
    setStatus(null);

    try {
      const parsed = parseQrPayload(raw);
      if (!parsed || parsed.kind !== 'guest') {
        throw new Error('Not a Portl guest pass QR');
      }

      const visitor = await fetchVisitorByQrToken(parsed.token);
      if (!visitor) throw new Error('Pass not found');
      if (
        membership?.society_id &&
        visitor.society_id !== membership.society_id
      ) {
        throw new Error('This pass is for another society');
      }

      const updated = await admit.mutateAsync({
        id: visitor.id,
        requireQr: true,
      });

      const left = remainingScans(updated);
      setStatus(
        `Admitted ${updated.visitor_name} · ${visitorFlatLabel(updated)}` +
          (left > 0 ? ` · ${left} left` : ' · pass complete'),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not admit pass');
    } finally {
      setTimeout(() => setLocked(false), 1600);
    }
  };

  if (memberships.isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!membership) {
    return (
      <View className="flex-1 bg-background px-6 justify-center">
        <Text variant="title" className="text-role-guard">
          Scan QR
        </Text>
        <Text variant="body" tone="muted" className="mt-2">
          No approved guard membership yet.
        </Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView className="flex-1 bg-background" behavior="padding">
      <View
        className="flex-1 px-5"
        style={{ paddingTop: insets.top + 12, paddingBottom: insets.bottom + 16 }}
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

        <Text variant="title" className="text-role-guard">
          Scan guest QR
        </Text>
        <Text variant="body" tone="muted" className="mt-1 mb-4">
          Only for passes marked QR available. List-admit for photo-only passes.
        </Text>

        {!permission?.granted ? (
          <View className="mb-4 rounded-xl border border-border bg-card px-4 py-4">
            <Text variant="body" tone="muted">
              Camera permission is needed to scan. You can still paste a token
              below if the camera build is unavailable.
            </Text>
            <Button
              className="mt-3"
              label="Allow camera"
              onPress={() => void requestPermission()}
            />
          </View>
        ) : (
          <View className="mb-4 h-64 overflow-hidden rounded-xl border border-border">
            <CameraView
              style={{ flex: 1 }}
              facing="back"
              barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
              onBarcodeScanned={
                locked
                  ? undefined
                  : (result) => {
                      void handlePayload(result.data);
                    }
              }
            />
          </View>
        )}

        {status ? (
          <Text variant="label" tone="primary" className="mb-2">
            {status}
          </Text>
        ) : null}
        {error ? (
          <Text variant="caption" tone="danger" className="mb-2">
            {error}
          </Text>
        ) : null}

        <TextInput
          label="Manual token / payload"
          value={manual}
          onChangeText={setManual}
          placeholder="portl:guest:… or UUID"
          autoCapitalize="none"
        />
        <Button
          className="mt-3"
          label="Admit from token"
          variant="outline"
          fullWidth
          loading={admit.isPending}
          onPress={() => void handlePayload(manual)}
        />

        <Button
          className="mt-4"
          label="Open visitor log"
          variant="ghost"
          fullWidth
          onPress={() =>
            router.push(
              membership.society_id
                ? (`/(guard)/visitors?societyId=${encodeURIComponent(membership.society_id)}&filter=preapproved` as Href)
                : ('/(guard)/visitors?filter=preapproved' as Href),
            )
          }
        />
      </View>
    </KeyboardAvoidingView>
  );
}
