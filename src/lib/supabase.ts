import 'react-native-url-polyfill/auto';
import 'react-native-get-random-values';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import * as aesjs from 'aes-js';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import type { Database } from '@/types/database';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

/**
 * Expo SecureStore rejects values larger than ~2048 bytes.
 * Store an AES key in SecureStore; encrypt session payloads in AsyncStorage.
 * Encryption key is created once and reused (required for session restore).
 */
class LargeSecureStore {
  private async getEncryptionKey(): Promise<Uint8Array> {
    const existing = await SecureStore.getItemAsync('supabase-encryption-key');
    if (existing) {
      return aesjs.utils.hex.toBytes(existing);
    }

    const key = crypto.getRandomValues(new Uint8Array(32));
    await SecureStore.setItemAsync(
      'supabase-encryption-key',
      aesjs.utils.hex.fromBytes(key),
    );
    return key;
  }

  private async encrypt(value: string): Promise<string> {
    const key = await this.getEncryptionKey();
    const iv = crypto.getRandomValues(new Uint8Array(16));
    const aesCtr = new aesjs.ModeOfOperation.ctr(key, new aesjs.Counter(iv));
    const encryptedBytes = aesCtr.encrypt(aesjs.utils.utf8.toBytes(value));
    return `${aesjs.utils.hex.fromBytes(iv)}:${aesjs.utils.hex.fromBytes(encryptedBytes)}`;
  }

  private async decrypt(value: string): Promise<string> {
    const [ivHex, dataHex] = value.split(':');
    if (!ivHex || !dataHex) {
      throw new Error('Invalid encrypted session payload');
    }
    const key = await this.getEncryptionKey();
    const iv = aesjs.utils.hex.toBytes(ivHex);
    const encryptedBytes = aesjs.utils.hex.toBytes(dataHex);
    const aesCtr = new aesjs.ModeOfOperation.ctr(key, new aesjs.Counter(iv));
    return aesjs.utils.utf8.fromBytes(aesCtr.decrypt(encryptedBytes));
  }

  async getItem(key: string): Promise<string | null> {
    if (Platform.OS === 'web') {
      return AsyncStorage.getItem(key);
    }
    const encrypted = await AsyncStorage.getItem(key);
    if (!encrypted) return null;
    try {
      return await this.decrypt(encrypted);
    } catch {
      await AsyncStorage.removeItem(key);
      return null;
    }
  }

  async setItem(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') {
      await AsyncStorage.setItem(key, value);
      return;
    }
    const encrypted = await this.encrypt(value);
    await AsyncStorage.setItem(key, encrypted);
  }

  async removeItem(key: string): Promise<void> {
    await AsyncStorage.removeItem(key);
  }
}

export const isSupabaseConfigured =
  Boolean(supabaseUrl) && Boolean(supabaseAnonKey);

if (!isSupabaseConfigured && __DEV__) {
  console.warn(
    '[Portl] Missing EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY. Copy .env.example → .env and fill values.',
  );
}

export const supabase = createClient<Database>(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key',
  {
    auth: {
      storage: new LargeSecureStore(),
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  },
);
