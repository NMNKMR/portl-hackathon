import { Redirect, Stack, useSegments, type Href } from "expo-router";
import { ActivityIndicator, View } from "react-native";

import { useAuth } from "@/hooks/use-auth";
import { useThemeColors } from "@/lib/theme-colors";

export default function AuthLayout() {
  const { session, profile, isLoading } = useAuth();
  const segments = useSegments();
  const colors = useThemeColors();

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  const phone = profile?.phone ?? session?.user.phone ?? null;
  const onCompletePhone = (segments as string[]).includes("complete-phone");

  if (session && phone) {
    return <Redirect href={"/(app)" as Href} />;
  }

  if (session && !phone && !onCompletePhone) {
    return <Redirect href="/(auth)/complete-phone" />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "fade_from_bottom",
        animationDuration: 300,
      }}
    />
  );
}
