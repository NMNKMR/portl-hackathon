import { useRouter, type Href } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';

import { Text } from '@/components/ui/text';
import { useAuth } from '@/hooks/use-auth';
import { useThemeColors } from '@/lib/theme-colors';

/** Shared sign-out control for role shells (hub auto-redirect hid the hub CTA). */
export function SignOutButton({ className }: { className?: string }) {
  const router = useRouter();
  const colors = useThemeColors();
  const { signOut } = useAuth();
  const [signingOut, setSigningOut] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignOut = async () => {
    setError(null);
    setSigningOut(true);
    try {
      await signOut();
      router.replace('/(auth)/login' as Href);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign out failed');
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <View className={className}>
      {error ? (
        <Text variant="caption" tone="danger" className="mb-2 text-center">
          {error}
        </Text>
      ) : null}
      <Pressable
        className="h-12 flex-row items-center justify-center rounded-xl"
        disabled={signingOut}
        onPress={() => void handleSignOut()}
      >
        {signingOut ? (
          <ActivityIndicator color={colors.danger} />
        ) : (
          <Text variant="label" className="text-danger">
            Sign out
          </Text>
        )}
      </Pressable>
    </View>
  );
}
