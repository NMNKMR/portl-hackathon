import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/ui/text';
import { useAuth } from '@/hooks/use-auth';
import { useThemeColors } from '@/lib/theme-colors';

/** Temporary post-auth hub until society onboarding ships. */
export default function AppHomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const colors = useThemeColors();
  const { profile, user, signOut } = useAuth();
  const [signingOut, setSigningOut] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignOut = async () => {
    setError(null);
    setSigningOut(true);
    try {
      await signOut();
      router.replace('/(auth)/login');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign out failed');
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <View
      className="flex-1 bg-background px-6"
      style={{ paddingTop: insets.top + 24, paddingBottom: insets.bottom + 16 }}
    >
      <Text variant="title" className="text-primary">
        You&apos;re in
      </Text>
      <Text variant="body" tone="muted" className="mt-2">
        {profile?.full_name ?? user?.email ?? 'Signed in'}
      </Text>
      <Text variant="caption" tone="muted" className="mt-1">
        {profile?.phone ?? user?.phone ?? 'No phone on profile'}
      </Text>

      <Text variant="body" className="mt-8">
        Next: create or join a society (coming up).
      </Text>

      <View className="mt-8 gap-3">
        <Pressable
          className="h-12 items-center justify-center rounded-xl bg-primary"
          onPress={() => router.push('/(admin)')}
        >
          <Text variant="label" tone="inverse">
            Preview Admin shell
          </Text>
        </Pressable>
        <Pressable
          className="h-12 items-center justify-center rounded-xl border border-border bg-card"
          onPress={() => router.push('/(resident)')}
        >
          <Text variant="label">Preview Resident shell</Text>
        </Pressable>
        <Pressable
          className="h-12 items-center justify-center rounded-xl border border-border bg-card"
          onPress={() => router.push('/(guard)')}
        >
          <Text variant="label">Preview Guard shell</Text>
        </Pressable>

        {error ? (
          <Text variant="caption" tone="danger">
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
    </View>
  );
}
