import { useRouter, type Href } from "expo-router";
import { Alert, Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import type { DashboardRole } from "@/components/role-dashboard-shell";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { useThemeColors } from "@/lib/theme-colors";

type DashboardTabId =
  | "home"
  | "visitors"
  | "notices"
  | "amenities"
  | "account";

type DashboardTab = {
  id: DashboardTabId;
  label: string;
  icon: "home" | "people" | "megaphone" | "calendar" | "person";
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

function homeHref(role: DashboardRole): Href {
  if (role === "admin") return "/(admin)" as Href;
  if (role === "guard") return "/(guard)" as Href;
  return "/(resident)" as Href;
}

function accountHref(role: DashboardRole): Href {
  if (role === "admin") return "/(admin)/account" as Href;
  if (role === "guard") return "/(guard)/account" as Href;
  return "/(resident)/account" as Href;
}

function visitorsHref(role: DashboardRole): Href {
  if (role === "admin") return "/(admin)/visitors" as Href;
  if (role === "guard") return "/(guard)/visitors" as Href;
  return "/(resident)/visitors" as Href;
}

type DashboardBottomNavProps = {
  role: DashboardRole;
  roleAccent: string;
  activeTab?: DashboardTabId;
};

export function DashboardBottomNav({
  role,
  roleAccent,
  activeTab = "home",
}: DashboardBottomNavProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();

  const tabs: DashboardTab[] = [
    {
      id: "home",
      label: "Home",
      icon: "home",
      onPress: () => router.replace(homeHref(role)),
    },
    {
      id: "visitors",
      label: "Visitors",
      icon: "people",
      onPress: () => router.replace(visitorsHref(role)),
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
      id: "account",
      label: "Account",
      icon: "person",
      onPress: () => router.replace(accountHref(role)),
    },
  ];

  return (
    <View
      className="border-t border-border bg-card"
      style={{ paddingBottom: Math.max(insets.bottom, 6) }}
    >
      {/* Selected indicator track sits at the top of the tab bar */}
      <View className="flex-row justify-around px-1">
        {tabs.map((tab) => (
          <View key={`indicator-${tab.id}`} className="h-1 w-[18%] items-center">
            {tab.id === activeTab ? (
              <View
                className="h-1 w-11 rounded-full"
                style={{ backgroundColor: roleAccent }}
              />
            ) : null}
          </View>
        ))}
      </View>

      <View className="flex-row items-center justify-around px-1 pt-1.5">
        {tabs.map((tab) => {
          const iconDef = TAB_ICONS[tab.icon];
          const active = tab.id === activeTab;
          const tint = active ? roleAccent : colors.muted;

          return (
            <Pressable
              key={tab.id}
              onPress={tab.onPress}
              className="min-w-12 flex-1 items-center py-0.5"
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
            >
              <Icon
                family={iconDef.family}
                name={iconDef.name}
                size={20}
                color={tint}
              />
              <Text
                variant="caption"
                className="mt-0.5 text-[10px] leading-tight"
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
