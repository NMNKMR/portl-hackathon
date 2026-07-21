import { LinearGradient } from "expo-linear-gradient";
import { Image, ImageBackground, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useCSSVariable, useUniwind } from "uniwind";

import { Text } from "@/components/ui/text";

const societyLight = require("../../../assets/images/society-light.png");
const societyDark = require("../../../assets/images/society-dark.png");
const brandLogo = require("../../../assets/icons/portl-logo.png");

function hexWithAlpha(hex: string, alpha: number): string {
  const normalized = hex.replace("#", "");
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function AuthHeaderPrimaryWash() {
  const [primaryLight, background] = useCSSVariable([
    "--color-primary-light",
    "--color-background",
  ]) as Array<string | undefined>;

  if (!primaryLight || !background) {
    return null;
  }

  return (
    <LinearGradient
      pointerEvents="none"
      style={StyleSheet.absoluteFill}
      colors={[
        hexWithAlpha(String(primaryLight), 0.085),
        hexWithAlpha(String(background), 0.8),
        hexWithAlpha(String(background), 0),
        hexWithAlpha(String(background), 0),
      ]}
      locations={[0, 0.4, 0.8, 1]}
      start={{ x: 0.6, y: 0 }}
      end={{ x: 0.85, y: 1 }}
    />
  );
}

/**
 * Full-bleed auth brand block. Decorations sit flush to screen edges;
 * only the logo/wordmark use safe-area + horizontal padding.
 */
export function AuthHeader() {
  const insets = useSafeAreaInsets();
  const { theme } = useUniwind();
  const isDark = theme === "dark";

  return (
    <View className="relative overflow-hidden">
      <AuthHeaderPrimaryWash />

      <View
        pointerEvents="none"
        className="absolute right-0 top-0 h-52 w-44 opacity-50"
      >
        <ImageBackground
          source={isDark ? societyDark : societyLight}
          resizeMode="cover"
          className="h-full w-full"
        />
      </View>

      <View
        className="items-center gap-2"
        style={{
          paddingTop: insets.top + 20,
          paddingHorizontal: 24,
          paddingBottom: 8,
        }}
      >
        <Image
          source={brandLogo}
          style={{ width: 64, height: 64 }}
          resizeMode="contain"
        />
        <Text variant="display" className="text-primary">
          Portl
        </Text>
        <Text variant="caption" tone="muted">
          Secure living. Stronger community.
        </Text>
      </View>
    </View>
  );
}
