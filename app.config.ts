import { ConfigContext, ExpoConfig } from "expo/config";

const IS_DEV = process.env.APP_VARIANT === "development";
const IS_PREVIEW = process.env.APP_VARIANT === "preview";

/** Keep in sync with `PORTL_NOTIFICATION_CHANNEL_ID` in src/constants/notifications.ts */
const PORTL_NOTIFICATION_CHANNEL_ID = "portl";

const getAppName = () => {
  if (IS_DEV) return "Portl (Dev)";
  if (IS_PREVIEW) return "Portl (Preview)";
  return "Portl";
};

const getPackageName = () => {
  if (IS_DEV) return "com.portl.app.dev";
  if (IS_PREVIEW) return "com.portl.app.preview";
  return "com.portl.app";
};

const getScheme = () => {
  if (IS_DEV) return "portl-dev";
  if (IS_PREVIEW) return "portl-preview";
  return "portl";
};

const getAppVariant = () => {
  if (IS_DEV) return "development";
  if (IS_PREVIEW) return "preview";
  return "production";
};

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: getAppName(),
  slug: "portl-hackathon",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/icons/ios-icon.png",
  scheme: getScheme(),
  userInterfaceStyle: "automatic",
  ios: {
    supportsTablet: false,
    bundleIdentifier: getPackageName(),
    icon: "./assets/icons/ios-icon.png",
    config: {
      usesNonExemptEncryption: false,
    },
    infoPlist: {
      UIBackgroundModes: ["remote-notification"],
    },
  },
  android: {
    package: getPackageName(),
    adaptiveIcon: {
      backgroundColor: "#FFFFFF",
      foregroundImage: "./assets/icons/android-icon-foreground.png",
      monochromeImage: "./assets/icons/android-icon-foreground.png",
    },
    predictiveBackGestureEnabled: false,
    googleServicesFile: "./google-services.json",
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
        cameraPermission:
          "Allow Portl to use the camera for visitor photos.",
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
    appVariant: getAppVariant(),
    eas: {
      projectId: "985ae7e3-0038-4855-a082-4576bccf68f0",
    },
  },
});
