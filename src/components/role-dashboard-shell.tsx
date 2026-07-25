import { LinearGradient } from "expo-linear-gradient";
import {
  Alert,
  Pressable,
  ScrollView,
  View,
  type ScrollViewProps,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { DashboardBottomNav } from "@/components/dashboard-bottom-nav";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { displayPersonName, getGreeting } from "@/lib/format";
import { useThemeColors } from "@/lib/theme-colors";

export type DashboardRole = "admin" | "resident" | "guard";

export type DashboardQuickAction = {
  id: string;
  label: string;
  icon:
    | "people"
    | "grid"
    | "share"
    | "qr"
    | "megaphone"
    | "construct"
    | "calendar";
  onPress?: () => void;
  disabled?: boolean;
};

export type DashboardSummaryCard = {
  id: string;
  label: string;
  value: string;
  icon:
    | "people"
    | "time"
    | "megaphone"
    | "cash"
    | "construct"
    | "shield"
    | "qr";
  linkLabel?: string;
  onPress?: () => void;
};

type RoleDashboardShellProps = {
  role: DashboardRole;
  userName?: string | null;
  /** Society name (or flat label) — do not append society code here */
  subtitle: string;
  quickActions: DashboardQuickAction[];
  summaryCards: DashboardSummaryCard[];
  prominentCta?: {
    label: string;
    onPress: () => void;
  };
  children?: React.ReactNode;
  scrollProps?: ScrollViewProps;
};

const QUICK_ACTION_ICONS = {
  people: { family: "ionic" as const, name: "person-add-outline" as const },
  grid: { family: "ionic" as const, name: "grid-outline" as const },
  share: { family: "ionic" as const, name: "share-outline" as const },
  qr: { family: "ionic" as const, name: "qr-code-outline" as const },
  megaphone: { family: "ionic" as const, name: "megaphone-outline" as const },
  construct: { family: "ionic" as const, name: "construct-outline" as const },
  calendar: { family: "ionic" as const, name: "calendar-outline" as const },
};

const SUMMARY_ICONS = {
  people: { family: "ionic" as const, name: "people-outline" as const },
  time: { family: "ionic" as const, name: "time-outline" as const },
  megaphone: { family: "ionic" as const, name: "megaphone-outline" as const },
  cash: { family: "ionic" as const, name: "cash-outline" as const },
  construct: { family: "ionic" as const, name: "construct-outline" as const },
  shield: { family: "ionic" as const, name: "shield-checkmark-outline" as const },
  qr: { family: "ionic" as const, name: "qr-code-outline" as const },
};

function roleAccentColor(
  role: DashboardRole,
  colors: ReturnType<typeof useThemeColors>,
) {
  if (role === "admin") return colors.roleAdmin;
  if (role === "guard") return colors.roleGuard;
  return colors.roleResident;
}

function roleAccentClass(role: DashboardRole) {
  if (role === "admin") return "text-role-admin";
  if (role === "guard") return "text-role-guard";
  return "text-role-resident";
}

function roleGradientColors(
  role: DashboardRole,
  colors: ReturnType<typeof useThemeColors>,
): [string, string] {
  const accent = roleAccentColor(role, colors);
  if (role === "admin") return [accent, colors.primary];
  if (role === "guard") return [accent, colors.primary];
  return [colors.primary, accent];
}

function comingSoonAlert() {
  Alert.alert("Coming next", "This section is part of the Tier 1 roadmap.");
}

export function RoleDashboardShell({
  role,
  userName,
  subtitle,
  quickActions,
  summaryCards,
  prominentCta,
  children,
  scrollProps,
}: RoleDashboardShellProps) {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const accent = roleAccentColor(role, colors);
  const gradient = roleGradientColors(role, colors);
  const accentClass = roleAccentClass(role);

  return (
    <View className="flex-1 bg-background">
      <LinearGradient
        colors={gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ paddingTop: insets.top + 8 }}
      >
        <View className="flex-row items-center gap-3 px-5 pb-14">
          <View className="h-12 w-12 items-center justify-center rounded-full bg-white/20">
            <Icon
              family="ionic"
              name="person"
              size={24}
              color={colors.onPrimary}
            />
          </View>
          <View className="min-w-0 flex-1">
            <Text variant="caption" tone="inverse">
              {getGreeting()}, 👋
            </Text>
            <Text variant="subtitle" tone="inverse" className="mt-0.5">
              {displayPersonName(userName, "Member")}
            </Text>
            <Text
              variant="caption"
              tone="inverse"
              className="mt-0.5 opacity-90"
              numberOfLines={1}
            >
              {subtitle}
            </Text>
          </View>
          <Pressable
            onPress={comingSoonAlert}
            hitSlop={8}
            className="h-10 w-10 items-center justify-center rounded-full bg-white/15"
          >
            <Icon
              family="ionic"
              name="notifications-outline"
              size={22}
              color={colors.onPrimary}
            />
          </Pressable>
        </View>
      </LinearGradient>

      <ScrollView
        className="flex-1 -mt-10"
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: 24,
        }}
        {...scrollProps}
      >
        <View className="rounded-2xl border border-border bg-card px-3 py-4 shadow-sm">
          <View className="flex-row flex-wrap justify-between gap-y-4">
            {quickActions.map((action) => {
              const iconDef = QUICK_ACTION_ICONS[action.icon];
              const disabled = action.disabled ?? !action.onPress;

              return (
                <Pressable
                  key={action.id}
                  disabled={disabled}
                  onPress={
                    action.onPress ??
                    (() =>
                      Alert.alert(
                        "Coming next",
                        `${action.label} is on the roadmap.`,
                      ))
                  }
                  className="w-[18%] min-w-14 items-center opacity-100 disabled:opacity-40"
                >
                  <View className="mb-1.5 h-11 w-11 items-center justify-center rounded-xl bg-neutral-100 dark:bg-neutral-800">
                    <Icon
                      family={iconDef.family}
                      name={iconDef.name}
                      size={22}
                      color={disabled ? colors.muted : accent}
                    />
                  </View>
                  <Text
                    variant="caption"
                    align="center"
                    className="text-[11px] leading-tight"
                  >
                    {action.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {prominentCta ? (
          <Button
            className="mt-4"
            variant="accent"
            size="lg"
            label={prominentCta.label}
            fullWidth
            onPress={prominentCta.onPress}
          />
        ) : null}

        <View className="mt-5 flex-row flex-wrap gap-3">
          {summaryCards.map((card) => {
            const iconDef = SUMMARY_ICONS[card.icon];

            return (
              <Pressable
                key={card.id}
                onPress={card.onPress ?? comingSoonAlert}
                className="min-w-[46%] flex-1 rounded-xl border border-border bg-card p-3"
              >
                <View className="mb-2 flex-row items-center gap-2">
                  <View
                    className="mb-0 h-8 w-8 items-center justify-center rounded-lg"
                    style={{ backgroundColor: `${accent}22` }}
                  >
                    <Icon
                      family={iconDef.family}
                      name={iconDef.name}
                      size={18}
                      color={accent}
                    />
                  </View>
                  <Text variant="caption" tone="muted" className="flex-1">
                    {card.label}
                  </Text>
                </View>
                <Text variant="title" className={accentClass}>
                  {card.value}
                </Text>
                {card.linkLabel ? (
                  <Text variant="caption" tone="primary" className="mt-1">
                    {card.linkLabel}
                  </Text>
                ) : null}
              </Pressable>
            );
          })}
        </View>

        {children}
      </ScrollView>

      <DashboardBottomNav role={role} roleAccent={accent} activeTab="home" />
    </View>
  );
}
