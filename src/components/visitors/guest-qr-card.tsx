import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { useRef, useState } from 'react';
import { Alert, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import type { VisitorRequest } from '@/lib/api/visitors';
import { buildGuestQrPayload } from '@/lib/visitor-qr';

type QrSvgRef = {
  toDataURL: (callback: (data: string) => void) => void;
};

type GuestQrCardProps = {
  visitor: VisitorRequest;
};

export function GuestQrCard({ visitor }: GuestQrCardProps) {
  const qrRef = useRef<QrSvgRef | null>(null);
  const [sharing, setSharing] = useState(false);

  if (!visitor.qr_token) return null;

  const payload = buildGuestQrPayload(visitor.qr_token);

  const shareImage = async () => {
    setSharing(true);
    try {
      if (!(await Sharing.isAvailableAsync())) {
        Alert.alert('Sharing unavailable', 'This device cannot share images.');
        return;
      }
      if (!qrRef.current) {
        throw new Error('QR not ready yet');
      }

      const data = await new Promise<string>((resolve, reject) => {
        try {
          qrRef.current!.toDataURL((value) => resolve(value));
        } catch (err) {
          reject(err);
        }
      });

      const base64 = data.replace(/^data:image\/\w+;base64,/, '');
      const path = `${FileSystem.cacheDirectory}portl-guest-${visitor.id}.png`;
      await FileSystem.writeAsStringAsync(path, base64, {
        encoding: FileSystem.EncodingType.Base64,
      });

      await Sharing.shareAsync(path, {
        mimeType: 'image/png',
        dialogTitle: `Pass for ${visitor.visitor_name}`,
      });
    } catch (err) {
      Alert.alert(
        'Share failed',
        err instanceof Error ? err.message : 'Could not share QR image',
      );
    } finally {
      setSharing(false);
    }
  };

  return (
    <View className="items-center rounded-2xl border border-border bg-card px-4 py-6">
      <Text variant="label" className="mb-3">
        QR available — guard must scan
      </Text>
      <View className="items-center rounded-2xl bg-white px-6 py-6">
        <Text variant="label" className="mb-3 text-center text-neutral-900">
          {visitor.visitor_name}
        </Text>
        <QRCode
          value={payload}
          size={220}
          backgroundColor="white"
          getRef={(ref) => {
            qrRef.current = ref as QrSvgRef | null;
          }}
        />
        <Text variant="caption" className="mt-3 text-center text-neutral-500">
          Portl guest pass
          {visitor.max_scans > 1 ? ` · ${visitor.max_scans} entries` : ''}
        </Text>
      </View>
      <Button
        className="mt-5"
        label="Share QR image"
        variant="outline"
        fullWidth
        loading={sharing}
        onPress={() => void shareImage()}
      />
    </View>
  );
}
