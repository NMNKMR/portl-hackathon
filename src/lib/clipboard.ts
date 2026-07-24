import * as Clipboard from 'expo-clipboard';
import { Alert } from 'react-native';

/** Copy text to the system clipboard; on failure surface the value in an Alert. */
export async function copyTextWithFallback(
  text: string,
  successMessage = 'Copied to clipboard',
): Promise<void> {
  try {
    await Clipboard.setStringAsync(text);
    Alert.alert('Copied', successMessage);
  } catch {
    Alert.alert('Copy unavailable', `Your code is: ${text}`);
  }
}
