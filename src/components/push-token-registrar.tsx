import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';

import { useAuth } from '@/hooks/use-auth';
import { upsertPushToken } from '@/lib/api/push-tokens';
import { PORTL_NOTIFICATION_CHANNEL_ID } from '@/constants/notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

async function ensureAndroidChannel() {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(PORTL_NOTIFICATION_CHANNEL_ID, {
    name: 'Portl',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
  });
}

async function registerExpoPushToken(userId: string): Promise<string | null> {
  if (!Device.isDevice) {
    return null;
  }

  await ensureAndroidChannel();

  const { status: existing } = await Notifications.getPermissionsAsync();
  let status = existing;
  if (existing !== 'granted') {
    const requested = await Notifications.requestPermissionsAsync();
    status = requested.status;
  }
  if (status !== 'granted') {
    return null;
  }

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId;
  if (!projectId || typeof projectId !== 'string') {
    console.warn('EAS projectId missing; cannot register Expo push token');
    return null;
  }

  const token = (
    await Notifications.getExpoPushTokenAsync({ projectId })
  ).data;

  await upsertPushToken({
    userId,
    expoPushToken: token,
  });

  return token;
}

/** Registers the device Expo push token for the signed-in user (dev client). */
export function PushTokenRegistrar() {
  const { user } = useAuth();
  const lastUserId = useRef<string | null>(null);

  useEffect(() => {
    if (!user?.id) {
      lastUserId.current = null;
      return;
    }
    if (lastUserId.current === user.id) return;
    lastUserId.current = user.id;

    void registerExpoPushToken(user.id).catch((err) => {
      console.warn('Push token registration failed', err);
    });
  }, [user?.id]);

  return null;
}
