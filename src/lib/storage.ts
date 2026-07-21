import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Uniwind } from 'uniwind';

export const PREF_KEYS = {
  theme: 'portl.theme',
} as const;

export type ThemePreference = 'light' | 'dark' | 'system';

export async function getThemePreference(): Promise<ThemePreference> {
  const value = await AsyncStorage.getItem(PREF_KEYS.theme);
  if (value === 'light' || value === 'dark' || value === 'system') {
    return value;
  }
  return 'system';
}

export async function setThemePreference(theme: ThemePreference): Promise<void> {
  await AsyncStorage.setItem(PREF_KEYS.theme, theme);
  Uniwind.setTheme(theme);
}

/** Apply persisted theme on cold start (call once from root layout). */
export async function hydrateThemePreference(): Promise<ThemePreference> {
  const theme = await getThemePreference();
  Uniwind.setTheme(theme);
  return theme;
}

export async function getPreference(key: string): Promise<string | null> {
  return AsyncStorage.getItem(key);
}

export async function setPreference(key: string, value: string): Promise<void> {
  await AsyncStorage.setItem(key, value);
}

export async function deletePreference(key: string): Promise<void> {
  await AsyncStorage.removeItem(key);
}

export async function setSecureItem(key: string, value: string): Promise<void> {
  await SecureStore.setItemAsync(key, value);
}

export async function getSecureItem(key: string): Promise<string | null> {
  return SecureStore.getItemAsync(key);
}

export async function deleteSecureItem(key: string): Promise<void> {
  await SecureStore.deleteItemAsync(key);
}
