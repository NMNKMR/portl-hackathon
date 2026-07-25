import { Platform } from 'react-native';

import { supabase } from '@/lib/supabase';

export async function upsertPushToken(input: {
  userId: string;
  expoPushToken: string;
  deviceType?: string | null;
}) {
  const deviceType =
    input.deviceType ??
    (Platform.OS === 'ios' || Platform.OS === 'android'
      ? Platform.OS
      : 'unknown');

  const { data: existing, error: selectError } = await supabase
    .from('push_tokens')
    .select('id')
    .eq('user_id', input.userId)
    .eq('expo_push_token', input.expoPushToken)
    .maybeSingle();

  if (selectError) throw selectError;

  if (existing) {
    const { data, error } = await supabase
      .from('push_tokens')
      .update({ device_type: deviceType })
      .eq('id', existing.id)
      .select('id, user_id, expo_push_token, device_type, created_at')
      .single();
    if (error) throw error;
    return data;
  }

  const { data, error } = await supabase
    .from('push_tokens')
    .insert({
      user_id: input.userId,
      expo_push_token: input.expoPushToken,
      device_type: deviceType,
    })
    .select('id, user_id, expo_push_token, device_type, created_at')
    .single();

  if (error) throw error;
  return data;
}

export async function deletePushToken(userId: string, expoPushToken: string) {
  const { error } = await supabase
    .from('push_tokens')
    .delete()
    .eq('user_id', userId)
    .eq('expo_push_token', expoPushToken);

  if (error) throw error;
}
