import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Fragment } from "react";
import {
  Alert,
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  type ScrollViewProps,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useUniwind } from "uniwind";

import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { displayPersonName, getGreeting } from "@/lib/format";
import { useThemeColors } from "@/lib/theme-colors";

const societyLight = require("../../assets/images/society-light.png");
const societyDark = require("../../assets/images/society-dark.png");

export type DashboardRole = "admin" | "resident" | "guard";

export type DashboardQuickAction = {
  id: string;
  /** Two-line label — each line renders on its own row for consistent alignment */
  labelLines: readonly [string, string];
  icon:
    | "people"
    | "grid"
    | "share"
    | "qr"
    | "megaphone"
    | "construct"
    | "peopleOutline"
    | "calendar";
  onPress?: () => void;
  disabled?: boolean;
};

export type DashboardStatTone = "teal" | "orange" | "blue";

export type DashboardSummaryCard = {
  id: string;
  label: string;
  value: string;
  linkLabel: string;
  icon:
    | "people"
    | "time"
    | "megaphone"
    | "cash"
    | "construct"
    | "shield"
    | "qr"
    | "chart"
    | "grid";
  tone?: DashboardStatTone;
  onPress?: () => void;
};

type RoleDashboardShellProps = {
  role: DashboardRole;
  userName?: string | null;
  avatarUrl?: string | null;
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
  peopleOutline: { family: "ionic" as const, name: "people-outline" as const },
  calendar: { family: "ionic" as const, name: "calendar-outline" as const },
};

const SUMMARY_ICONS = {
  people: { family: "ionic" as const, name: "people-outline" as const },
  time: { family: "ionic" as const, name: "time-outline" as const },
  megaphone: { family: "ionic" as const, name: "megaphone-outline" as const },
  cash: { family: "ionic" as const, name: "cash-outline" as const },
  construct: { family: "ionic" as const, name: "construct-outline" as const },
  shield: {
    family: "ionic" as const,
    name: "shield-checkmark-outline" as const,
  },
  qr: { family: "ionic" as const, name: "qr-code-outline" as const },
  chart: { family: "ionic" as const, name: "bar-chart-outline" as const },
  grid: { family: "ionic" as const, name: "grid-outline" as const },
};

const STAT_CARD_TONES: DashboardStatTone[] = ["teal", "orange", "blue"];

function statCardToneColors(
  tone: DashboardStatTone,
  colors: ReturnType<typeof useThemeColors>,
) {
  if (tone === "teal") {
    return {
      fg: colors.statTeal,
      bg: hexWithAlpha(colors.statTeal, 0.1),
      iconBg: hexWithAlpha(colors.statTeal, 0.18),
    };
  }
  if (tone === "orange") {
    return {
      fg: colors.statOrange,
      bg: hexWithAlpha(colors.statOrange, 0.1),
      iconBg: hexWithAlpha(colors.statOrange, 0.18),
    };
  }
  return {
    fg: colors.statBlue,
    bg: hexWithAlpha(colors.statBlue, 0.1),
    iconBg: hexWithAlpha(colors.statBlue, 0.18),
  };
}

function chunkSummaryCards(cards: DashboardSummaryCard[], size: number) {
  const rows: DashboardSummaryCard[][] = [];
  for (let index = 0; index < cards.length; index += size) {
    rows.push(cards.slice(index, index + size));
  }
  return rows;
}

function hexWithAlpha(hex: string, alpha: number): string {
  const normalized = hex.replace("#", "");
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function roleAccentColor(
  role: DashboardRole,
  colors: ReturnType<typeof useThemeColors>,
) {
  if (role === "admin") return colors.roleAdmin;
  if (role === "guard") return colors.roleGuard;
  return colors.roleResident;
}

function RoleHeaderBackground({ role }: { role: DashboardRole }) {
  const colors = useThemeColors();
  const { theme } = useUniwind();
  const isDark = theme === "dark";
  const accent = roleAccentColor(role, colors);

  return (
    <>
      <LinearGradient
        pointerEvents="none"
        style={StyleSheet.absoluteFill}
        colors={[
          hexWithAlpha(accent, 0.22),
          hexWithAlpha(accent, 0.1),
          hexWithAlpha(accent, 0),
          hexWithAlpha(colors.background, 0),
        ]}
        locations={[0, 0.38, 0.62, 0.88]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.8, y: 0.8 }}
      />
      <View
        pointerEvents="none"
        className="absolute right-0 top-0 h-48 w-44 overflow-hidden"
      >
        <ImageBackground
          source={isDark ? societyDark : societyLight}
          resizeMode="cover"
          className="h-full w-full opacity-65"
        />
        <LinearGradient
          pointerEvents="none"
          style={StyleSheet.absoluteFill}
          colors={[
            hexWithAlpha(colors.background, 1),
            hexWithAlpha(colors.background, 0.72),
            hexWithAlpha(colors.background, 0),
          ]}
          locations={[0, 0.4, 1]}
          start={{ x: 0, y: 0.35 }}
          end={{ x: 1, y: 0.65 }}
        />
      </View>
    </>
  );
}

function comingSoonAlert() {
  Alert.alert("Coming next", "This section is part of the Tier 1 roadmap.");
}

export function RoleDashboardShell({
  role,
  userName,
  avatarUrl,
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

  return (
    <View className="flex-1 bg-background">
      <View
        className="relative overflow-hidden bg-background"
        style={{ paddingTop: insets.top + 8 }}
      >
        <RoleHeaderBackground role={role} />
        <View className="z-10 flex-row items-center gap-3 px-5 pb-14">
          <View
            className="h-12 w-12 overflow-hidden rounded-full"
            style={{ backgroundColor: `${accent}22` }}
          >
            {avatarUrl ? (
              <Image
                key={avatarUrl}
                source={{ uri: avatarUrl }}
                style={{ width: 48, height: 48 }}
                contentFit="cover"
                recyclingKey={avatarUrl}
              />
            ) : (
              <View className="h-full w-full items-center justify-center">
                <Icon family="ionic" name="person" size={24} color={accent} />
              </View>
            )}
          </View>
          <View className="min-w-0 flex-1">
            <Text variant="caption" tone="muted">
              {getGreeting()}, 👋
            </Text>
            <Text variant="subtitle" className="mt-0.5">
              {displayPersonName(userName, "Member")}
            </Text>
            <Text
              variant="caption"
              tone="muted"
              className="mt-0.5 text-[11px] leading-tight"
              numberOfLines={1}
            >
              {subtitle}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        className="flex-1 -mt-10"
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: 40,
        }}
        {...scrollProps}
      >
        <View className="rounded-2xl border border-border bg-card px-1 py-2.5 shadow-sm">
          <View className="flex-row items-stretch">
            {quickActions.map((action, index) => {
              const iconDef = QUICK_ACTION_ICONS[action.icon];
              const disabled = action.disabled ?? !action.onPress;
              const actionLabel = action.labelLines.join(" ");

              return (
                <Fragment key={action.id}>
                  {index > 0 ? (
                    <View className="my-2 w-px self-stretch bg-border" />
                  ) : null}
                  <Pressable
                    disabled={disabled}
                    onPress={
                      action.onPress ??
                      (() =>
                        Alert.alert(
                          "Coming next",
                          `${actionLabel} is on the roadmap.`,
                        ))
                    }
                    className="flex-1 items-center justify-center px-1 opacity-100 disabled:opacity-40"
                    accessibilityRole="button"
                    accessibilityLabel={actionLabel}
                  >
                    <View className="h-9 w-9 items-center justify-center rounded-lg bg-neutral-100 dark:bg-neutral-800">
                      <Icon
                        family={iconDef.family}
                        name={iconDef.name}
                        size={20}
                        color={disabled ? colors.muted : accent}
                      />
                    </View>
                    <View className="mt-1 h-7 items-center justify-center">
                      <Text
                        variant="caption"
                        align="center"
                        className="text-[10px] leading-3.25"
                      >
                        {action.labelLines[0]}
                      </Text>
                      <Text
                        variant="caption"
                        align="center"
                        className="text-[10px] leading-3.25"
                      >
                        {action.labelLines[1]}
                      </Text>
                    </View>
                  </Pressable>
                </Fragment>
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

        <View className="mt-5 gap-2.5">
          {chunkSummaryCards(summaryCards, 3).map((row, rowIndex) => (
            <View key={`stat-row-${rowIndex}`} className="flex-row gap-2.5">
              {row.map((card, columnIndex) => {
                const iconDef = SUMMARY_ICONS[card.icon];
                const tone =
                  card.tone ??
                  STAT_CARD_TONES[
                    (rowIndex * 3 + columnIndex) % STAT_CARD_TONES.length
                  ];
                const toneColors = statCardToneColors(tone, colors);

                return (
                  <Pressable
                    key={card.id}
                    onPress={card.onPress ?? comingSoonAlert}
                    className="min-w-0 flex-1 rounded-xl p-2.5"
                    style={{ backgroundColor: toneColors.bg }}
                  >
                    <View
                      className="h-8 w-8 items-center justify-center rounded-full"
                      style={{ backgroundColor: toneColors.iconBg }}
                    >
                      <Icon
                        family={iconDef.family}
                        name={iconDef.name}
                        size={16}
                        color={toneColors.fg}
                      />
                    </View>
                    <Text
                      variant="title"
                      className="mt-1.5 text-xl text-foreground"
                      numberOfLines={1}
                    >
                      {card.value}
                    </Text>
                    <Text
                      variant="caption"
                      tone="muted"
                      className="mt-0.5 text-[10px] leading-tight"
                      numberOfLines={2}
                    >
                      {card.label}
                    </Text>
                    <View className="mt-1 flex-row items-center">
                      <Text
                        variant="caption"
                        className="text-[10px] font-sans-medium leading-tight"
                        style={{ color: toneColors.fg }}
                        numberOfLines={1}
                      >
                        {card.linkLabel}
                      </Text>
                      <Icon
                        family="ionic"
                        name="chevron-forward"
                        size={11}
                        color={toneColors.fg}
                      />
                    </View>
                  </Pressable>
                );
              })}
            </View>
          ))}
        </View>

        {children}
      </ScrollView>
    </View>
  );
}
