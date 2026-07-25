import { CameraView, useCameraPermissions } from 'expo-camera';
import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { VisitorFlowHeader } from '@/components/visitors/visitor-flow-header';
import { useMyMemberships } from '@/hooks/use-society';
import { useAdmitVisitorEntry } from '@/hooks/use-visitors';
import { fetchStaffByPassToken, staffFlatLabel } from '@/lib/api/staff';
import { fetchVisitorByQrToken, visitorFlatLabel } from '@/lib/api/visitors';
import { useThemeColors } from '@/lib/theme-colors';
import { parseQrPayload, remainingScans } from '@/lib/visitor-qr';

type ScanSuccess = {
  title: string;
  detail: string;
  staffHref?: Href;
};

export default function GuardScanVisitorScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const { width } = useWindowDimensions();
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
  const [success, setSuccess] = useState<ScanSuccess | null>(null);
  const [error, setError] = useState<string | null>(null);

  const squareSize = Math.min(width - 40, 360);

  const resetScan = () => {
    setSuccess(null);
    setError(null);
    setLocked(false);
  };

  const handlePayload = async (raw: string) => {
    if (locked || success) return;
    setLocked(true);
    setError(null);

    try {
      const parsed = parseQrPayload(raw);
      if (!parsed) {
        throw new Error('Not a Portl guest or staff QR');
      }

      if (parsed.kind === 'staff') {
        const staff = await fetchStaffByPassToken(parsed.token);
        if (!staff) throw new Error('Staff pass not found');
        if (
          membership?.society_id &&
          staff.society_id !== membership.society_id
        ) {
          throw new Error('This pass is for another society');
        }
        if (!staff.is_recurring) {
          throw new Error('This staff pass is not marked recurring');
        }
        setSuccess({
          title: 'Staff verified',
          detail: `${staff.name} · ${staff.category_name ?? 'Staff'} · ${staffFlatLabel(staff)}`,
          staffHref:
            `/(guard)/staff/${staff.id}?societyId=${encodeURIComponent(staff.society_id)}` as Href,
        });
        return;
      }

      const visitor = await fetchVisitorByQrToken(parsed.token);
      if (!visitor) throw new Error('Guest pass not found');
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
      setSuccess({
        title: 'Entry recorded',
        detail:
          `${updated.visitor_name} · ${visitorFlatLabel(updated)}` +
          (left > 0 ? ` · ${left} left` : ' · pass complete'),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not process pass');
      setTimeout(() => setLocked(false), 1200);
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
    <View
      className="flex-1 bg-background px-5"
      style={{
        paddingTop: insets.top + 12,
        paddingBottom: insets.bottom + 16,
      }}
    >
      <VisitorFlowHeader
        role="guard"
        title="Scan QR"
        subtitle="Align the guest or staff pass inside the square."
        showBack
      />

      {success ? (
        <View className="flex-1 items-center justify-center px-4">
          <View className="mb-5 w-full max-w-sm rounded-2xl border border-success/30 bg-success/10 px-6 py-8">
            <View className="mb-4 self-center">
              <View className="h-24 w-24 items-center justify-center rounded-full bg-success/15">
                <Icon
                  family="ionic"
                  name="checkmark-circle"
                  size={72}
                  color={colors.success}
                />
              </View>
            </View>
            <Text variant="title" className="text-center text-success">
              {success.title}
            </Text>
            <Text variant="body" tone="muted" className="mt-2 text-center">
              {success.detail}
            </Text>
          </View>
          {success.staffHref ? (
            <Button
              className="w-full max-w-sm"
              label="View staff"
              fullWidth
              onPress={() => router.push(success.staffHref!)}
            />
          ) : null}
          <Button
            className="mt-3 w-full max-w-sm"
            label="Scan another"
            variant={success.staffHref ? 'outline' : 'accent'}
            fullWidth
            onPress={resetScan}
          />
        </View>
      ) : (
        <>
          {!permission?.granted ? (
            <View className="mb-4 rounded-2xl border border-border bg-card px-4 py-5">
              <View className="mb-3 h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Icon
                  family="ionic"
                  name="camera-outline"
                  size={24}
                  color={colors.primary}
                />
              </View>
              <Text variant="label">Camera access needed</Text>
              <Text variant="body" tone="muted" className="mt-1">
                Allow camera access to scan guest and staff QR passes.
              </Text>
              <Button
                className="mt-4"
                label="Allow camera"
                onPress={() => void requestPermission()}
              />
            </View>
          ) : (
            <View className="items-center">
              <View
                className="overflow-hidden rounded-2xl border-2 border-role-guard bg-black"
                style={{ width: squareSize, height: squareSize }}
              >
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
              <Text variant="caption" tone="muted" className="mt-4 text-center">
                {locked ? 'Processing…' : 'Hold steady over the code'}
              </Text>
            </View>
          )}

          {error ? (
            <View className="mt-4 rounded-xl border border-danger/30 bg-danger/10 px-4 py-3">
              <Text variant="caption" tone="danger" className="text-center">
                {error}
              </Text>
            </View>
          ) : null}

          <Button
            className="mt-auto"
            label="Staff directory"
            variant="ghost"
            fullWidth
            onPress={() =>
              router.push(
                membership.society_id
                  ? (`/(guard)/staff?societyId=${encodeURIComponent(membership.society_id)}` as Href)
                  : ('/(guard)/staff' as Href),
              )
            }
          />
        </>
      )}
    </View>
  );
}
