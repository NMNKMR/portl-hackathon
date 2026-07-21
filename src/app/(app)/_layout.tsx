import { Redirect, Stack, type Href } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

import { useAuth } from '@/hooks/use-auth';
import { useThemeColors } from '@/lib/theme-colors';

export default function AppLayout() {
  const { session, isLoading } = useAuth();
  const colors = useThemeColors();

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!session) {
    return <Redirect href={'/(auth)/login' as Href} />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
