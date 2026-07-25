import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Share,
  View,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { useStaffMember } from '@/hooks/use-staff';
import { staffFlatLabel } from '@/lib/api/staff';
import { useThemeColors } from '@/lib/theme-colors';
import { buildStaffQrPayload } from '@/lib/visitor-qr';

type StaffDetailScreenProps = {
  staffId: string;
  titleClassName: string;
  mode: 'manage' | 'verify';
  onVerified?: () => void;
};

export function StaffDetailScreen({
  staffId,
  titleClassName,
  mode,
  onVerified,
}: StaffDetailScreenProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const staffQuery = useStaffMember(staffId);
  const [verified, setVerified] = useState(false);

  const staff = staffQuery.data;
  const payload = useMemo(
    () => (staff ? buildStaffQrPayload(staff.pass_token) : null),
    [staff],
  );

  const sharePass = async () => {
    if (!staff || !payload) return;
    try {
      await Share.share({
        message: `Portl staff pass for ${staff.name}: ${payload}`,
      });
    } catch {
      // cancelled
    }
  };

  if (staffQuery.isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!staff) {
    return (
      <View className="flex-1 bg-background px-6 justify-center">
        <Text variant="title" className={titleClassName}>
          Staff
        </Text>
        <Text variant="body" tone="muted" className="mt-2">
          Staff member not found.
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

      <View className="mb-2 flex-row items-start justify-between gap-2">
        <View className="flex-1">
          <Text variant="title" className={titleClassName}>
            {staff.name}
          </Text>
          <Text variant="body" tone="muted" className="mt-1">
            {staff.category_name ?? 'Staff'} · {staffFlatLabel(staff)}
          </Text>
        </View>
        {staff.is_recurring ? (
          <Badge tone="success" label="Recurring" />
        ) : null}
      </View>

      {staff.phone ? (
        <Text variant="caption" tone="muted" className="mb-4">
          {staff.phone}
        </Text>
      ) : null}

      {mode === 'verify' ? (
        <View className="rounded-2xl border border-border bg-card px-4 py-5">
          <Text variant="label" className="mb-2">
            Recurring pass check
          </Text>
          <Text variant="body" tone="muted">
            Confirm identity matches this directory entry, then mark verified.
            No visitor request is created.
          </Text>
          {verified ? (
            <Text variant="label" tone="primary" className="mt-4">
              Verified — allow entry
            </Text>
          ) : (
            <Button
              className="mt-4"
              label="Mark verified"
              fullWidth
              variant="accent"
              onPress={() => {
                setVerified(true);
                onVerified?.();
              }}
            />
          )}
        </View>
      ) : payload ? (
        <View className="items-center rounded-2xl border border-border bg-card px-4 py-6">
          <Text variant="label" className="mb-3">
            Recurring pass QR
          </Text>
          <QRCode value={payload} size={200} />
          <Button
            className="mt-5"
            label="Share pass"
            variant="outline"
            fullWidth
            onPress={() => void sharePass()}
          />
        </View>
      ) : null}

      <Button
        className="mt-6"
        label="Done"
        variant="ghost"
        fullWidth
        onPress={() => router.back()}
      />
    </ScrollView>
  );
}
