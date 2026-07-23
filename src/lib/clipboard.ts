import { Alert } from 'react-native';

/** Copy text when expo-clipboard is installed; otherwise surface the value. */
export async function copyTextWithFallback(
  text: string,
  successMessage = 'Copied to clipboard',
): Promise<void> {
  try {
    // Optional dependency — not bundled unless `npx expo install expo-clipboard`.
    const moduleName = 'expo-clipboard';
    const Clipboard = (await import(moduleName)) as {
      setStringAsync: (value: string) => Promise<void>;
    };
    await Clipboard.setStringAsync(text);
    Alert.alert('Copied', successMessage);
  } catch {
    Alert.alert('Copy unavailable', `Your code is: ${text}`);
  }
}
