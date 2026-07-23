import { useRouter, type Href } from "expo-router";
import { Alert, Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { useThemeColors } from "@/lib/theme-colors";

type DashboardTab = {
  id: string;
  label: string;
  icon: "home" | "people" | "megaphone" | "calendar" | "person";
  active?: boolean;
  onPress: () => void;
};

const TAB_ICONS = {
  home: { family: "ionic" as const, name: "home" as const },
  people: { family: "ionic" as const, name: "people" as const },
  megaphone: { family: "ionic" as const, name: "megaphone-outline" as const },
  calendar: { family: "ionic" as const, name: "calendar-outline" as const },
  person: { family: "ionic" as const, name: "person-outline" as const },
};

function comingSoonAlert() {
  Alert.alert("Coming next", "This section is part of the Tier 1 roadmap.");
}

type DashboardBottomNavProps = {
  roleAccent: string;
};

export function DashboardBottomNav({ roleAccent }: DashboardBottomNavProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();

  const tabs: DashboardTab[] = [
    {
      id: "home",
      label: "Home",
      icon: "home",
      active: true,
      onPress: () => undefined,
    },
    {
      id: "visitors",
      label: "Visitors",
      icon: "people",
      onPress: comingSoonAlert,
    },
    {
      id: "notices",
      label: "Notices",
      icon: "megaphone",
      onPress: comingSoonAlert,
    },
    {
      id: "amenities",
      label: "Amenities",
      icon: "calendar",
      onPress: comingSoonAlert,
    },
    {
      id: "profile",
      label: "Hub",
      icon: "person",
      onPress: () => router.push("/(app)" as Href),
    },
  ];

  return (
    <View
      className="border-t border-border bg-card"
      style={{ paddingBottom: Math.max(insets.bottom, 8) }}
    >
      <View className="flex-row items-end justify-around px-2 pt-2">
        {tabs.map((tab) => {
          const iconDef = TAB_ICONS[tab.icon];
          const tint = tab.active ? roleAccent : colors.muted;

          return (
            <Pressable
              key={tab.id}
              onPress={tab.onPress}
              className="min-w-14 items-center py-1"
              accessibilityRole="button"
              accessibilityState={{ selected: tab.active }}
            >
              {tab.active ? (
                <View
                  className="mb-1 h-0.5 w-8 rounded-full"
                  style={{ backgroundColor: roleAccent }}
                />
              ) : (
                <View className="mb-1 h-0.5 w-8" />
              )}
              <Icon
                family={iconDef.family}
                name={iconDef.name}
                size={22}
                color={tint}
              />
              <Text
                variant="caption"
                className="mt-0.5"
                style={{ color: tint }}
              >
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
