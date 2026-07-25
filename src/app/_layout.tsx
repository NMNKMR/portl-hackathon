import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  useFonts,
} from "@expo-google-fonts/plus-jakarta-sans";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { View } from "react-native";

import { SystemBackgroundSync } from "@/components/system-background-sync";
import { PushTokenRegistrar } from "@/components/push-token-registrar";
import { AppProviders } from "@/providers/app-providers";

import { useThemeColors } from "@/lib/theme-colors";
import "../../global.css";

SplashScreen.preventAutoHideAsync().catch(() => undefined);

export default function RootLayout() {
  const { background } = useThemeColors();
  const [fontsLoaded, fontError] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync().catch(() => undefined);
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <AppProviders>
      <SystemBackgroundSync />
      <PushTokenRegistrar />
      <View className="flex-1 bg-background">
        <StatusBar style="auto" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: background },
          }}
        />
      </View>
    </AppProviders>
  );
}
