import type { ConfigContext, ExpoConfig } from "expo/config";

import { PORTL_NOTIFICATION_CHANNEL_ID } from "./src/constants/notifications";

type AppVariant = "development" | "preview" | "production";
const APP_VARIANT = (process.env.APP_VARIANT ?? "development") as AppVariant;

const VARIANT_CONFIG: Record<
  AppVariant,
  {
    name: string;
    packageName: string;
    scheme: string;
  }
> = {
  development: {
    name: "Portl (Dev)",
    packageName: "com.portl.app.dev",
    scheme: "portl-dev",
  },
  preview: {
    name: "Portl (Preview)",
    packageName: "com.portl.app.preview",
    scheme: "portl-preview",
  },
  production: {
    name: "Portl",
    packageName: "com.portl.app",
    scheme: "portl",
  },
};

const variant = VARIANT_CONFIG[APP_VARIANT];

/** One Firebase file can list all Android package IDs (dev / preview / prod). */
const GOOGLE_SERVICES_FILE = "./google-services.json";

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: variant.name,
  slug: "portl-hackathon",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/icons/ios-icon.png",
  scheme: variant.scheme,
  userInterfaceStyle: "automatic",
  ios: {
    supportsTablet: false,
    bundleIdentifier: variant.packageName,
    icon: "./assets/icons/ios-icon.png",
    config: {
      usesNonExemptEncryption: false,
    },
    infoPlist: {
      UIBackgroundModes: ["remote-notification"],
    },
  },
  android: {
    package: variant.packageName,
    adaptiveIcon: {
      backgroundColor: "#FFFFFF",
      foregroundImage: "./assets/icons/android-icon-foreground.png",
      monochromeImage: "./assets/icons/android-icon-foreground.png",
    },
    predictiveBackGestureEnabled: false,
    googleServicesFile: GOOGLE_SERVICES_FILE,
    permissions: ["RECEIVE_BOOT_COMPLETED", "VIBRATE"],
  },
  web: {
    output: "static",
    favicon: "./assets/icons/ios-icon.png",
  },
  plugins: [
    "expo-router",
    "expo-dev-client",
    [
      "expo-notifications",
      {
        icon: "./assets/icons/notification-icon.png",
        color: "#0F766E",
        defaultChannel: PORTL_NOTIFICATION_CHANNEL_ID,
      },
    ],
    [
      "expo-splash-screen",
      {
        backgroundColor: "#faf8f5",
        image: "./assets/icons/portl-brand.png",
        imageWidth: 200,
        dark: {
          backgroundColor: "#1a1816",
          image: "./assets/icons/portl-brand.png",
        },
      },
    ],
    "expo-secure-store",
    "expo-font",
    [
      "expo-image-picker",
      {
        photosPermission:
          "Allow Portl to access your photos for visitor and profile images.",
        cameraPermission: "Allow Portl to use the camera for visitor photos.",
      },
    ],
    "@react-native-vector-icons/ionicons",
    "@react-native-vector-icons/material-icons",
    "@react-native-vector-icons/material-design-icons",
    "@react-native-vector-icons/feather",
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
  extra: {
    appVariant: APP_VARIANT,
    eas: {
      // Filled by `eas init` / first EAS link — do not invent a UUID here.
      projectId: process.env.EAS_PROJECT_ID ?? undefined,
    },
  },
});
