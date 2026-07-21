import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Pressable,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AuthHeader } from '@/components/auth/auth-header';
import { Text } from '@/components/ui/text';
import { useAuth } from '@/hooks/use-auth';
import { isValidIndiaMobile } from '@/lib/phone';
import { useThemeColors } from '@/lib/theme-colors';

export default function CompletePhoneScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const { updatePhone, isLoading } = useAuth();

  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const busy = isLoading || isSubmitting;

  const handleSave = async () => {
    setError(null);

    const phoneLocal = phone.replace(/\D/g, '');

    if (!isValidIndiaMobile(phoneLocal)) {
      setError('Enter a valid 10-digit mobile number');
      return;
    }

    setIsSubmitting(true);
    try {
      await updatePhone(phoneLocal);
      router.replace('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save phone number');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View className="flex-1 bg-background">
      <AuthHeader />

      <KeyboardAvoidingView className="flex-1" behavior="padding">
        <View
          className="flex-1 px-6"
          style={{ paddingBottom: Math.max(insets.bottom, 16) }}
        >
          <View className="mt-5 gap-1">
            <Text variant="title">Add your number</Text>
            <Text variant="body" tone="muted">
              We need your mobile number to secure your account.
            </Text>
          </View>

          <View className="mt-6 gap-4">
            <View className="gap-1.5">
              <Text variant="label">Mobile Number</Text>
              <View className="h-12 flex-row items-center rounded-xl border border-border bg-card">
                <View className="h-full flex-row items-center gap-1 border-r border-border px-3">
                  <Text variant="body">🇮🇳</Text>
                  <Text variant="body">+91</Text>
                </View>
                <TextInput
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="Enter mobile number"
                  placeholderTextColor={colors.placeholder}
                  keyboardType="phone-pad"
                  autoComplete="tel"
                  textContentType="telephoneNumber"
                  maxLength={10}
                  editable={!busy}
                  className="flex-1 px-3 py-0 text-base text-foreground font-sans"
                />
              </View>
            </View>

            {error ? (
              <Text variant="caption" tone="danger">
                {error}
              </Text>
            ) : null}

            <Pressable
              accessibilityRole="button"
              disabled={busy}
              onPress={handleSave}
              className={`mt-1 h-12 flex-row items-center justify-center rounded-xl bg-primary active:opacity-90 ${busy ? 'opacity-50' : ''}`}
            >
              {isSubmitting ? (
                <ActivityIndicator color={colors.onPrimary} />
              ) : (
                <Text variant="label" tone="inverse">
                  Save
                </Text>
              )}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
