import { useMemo, useState } from 'react';
import { Share, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { StaffDetailContent } from '@/components/staff/staff-detail-content';
import type { StaffMember } from '@/lib/api/staff';
import { useThemeColors } from '@/lib/theme-colors';
import { buildStaffQrPayload } from '@/lib/visitor-qr';

type StaffPassQrCardProps = {
  staff: StaffMember;
};

export function StaffPassQrCard({ staff }: StaffPassQrCardProps) {
  const colors = useThemeColors();
  const payload = useMemo(
    () => buildStaffQrPayload(staff.pass_token),
    [staff.pass_token],
  );

  const sharePass = async () => {
    try {
      await Share.share({
        message: `Portl staff pass for ${staff.name}: ${payload}`,
      });
    } catch {
      // cancelled
    }
  };

  if (!staff.is_recurring) {
    return (
      <View className="rounded-2xl border border-border bg-card px-4 py-4">
        <Text variant="label">No recurring pass</Text>
        <Text variant="body" tone="muted" className="mt-2">
          This entry is marked one-time. Register them as a visitor at the gate
          when they arrive.
        </Text>
      </View>
    );
  }

  return (
    <View className="items-center rounded-2xl border border-border bg-card px-4 py-6">
      <Text variant="label" className="mb-1">
        Recurring pass QR
      </Text>
      <Text variant="caption" tone="muted" className="mb-4 text-center">
        Guard scans this at the gate — no visitor request needed
      </Text>
      <View className="items-center rounded-2xl bg-white px-6 py-6">
        <Text variant="label" className="mb-3 text-center text-neutral-900">
          {staff.name}
        </Text>
        <QRCode value={payload} size={200} backgroundColor="white" />
      </View>
      <Button
        className="mt-5"
        label="Share pass"
        variant="outline"
        fullWidth
        icon={{ family: 'ionic', name: 'share-outline' }}
        onPress={() => void sharePass()}
      />
      <View className="mt-4 flex-row items-center gap-2 self-start rounded-xl bg-primary/10 px-3 py-2">
        <Icon family="ionic" name="qr-code-outline" size={16} color={colors.primary} />
        <Text variant="caption" tone="primary">
          Also scannable from Guard → Scan QR
        </Text>
      </View>
    </View>
  );
}
