import Ionicons from '@react-native-vector-icons/ionicons';
import { Tabs } from 'expo-router';
import type { ComponentProps } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/ui/icon';
import { useThemeColors } from '@/lib/theme-colors';

const TAB_BAR_TOP_PAD = 6;
const TAB_BAR_CONTENT_HEIGHT = 52;
const TAB_BAR_MIN_BOTTOM_PAD = 8;

export type RoleTabAccent = 'admin' | 'resident' | 'guard';

type TabIconName = ComponentProps<typeof Ionicons>['name'];

function TabBarIcon({ name, color }: { name: TabIconName; color: string }) {
  return <Icon family="ionic" name={name} size={22} color={color} />;
}

export function useRoleTabScreenOptions(role: RoleTabAccent) {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const accent =
    role === 'admin'
      ? colors.roleAdmin
      : role === 'guard'
        ? colors.roleGuard
        : colors.roleResident;

  const tabBarBottomPad = Math.max(insets.bottom, TAB_BAR_MIN_BOTTOM_PAD);
  const tabBarHeight =
    TAB_BAR_CONTENT_HEIGHT + TAB_BAR_TOP_PAD + tabBarBottomPad;

  return {
    accent,
    colors,
    insets,
    screenOptions: {
      headerShown: false,
      tabBarActiveTintColor: accent,
      tabBarInactiveTintColor: colors.muted,
      tabBarHideOnKeyboard: true,
      tabBarStyle: {
        backgroundColor: colors.card,
        borderTopColor: colors.border,
        borderTopWidth: 1,
        height: tabBarHeight,
        paddingTop: TAB_BAR_TOP_PAD,
        paddingBottom: tabBarBottomPad,
      },
      tabBarLabelStyle: {
        fontSize: 10,
        fontWeight: '500' as const,
      },
    } satisfies ComponentProps<typeof Tabs>['screenOptions'],
  };
}

export function roleTabIcon(
  focusedName: TabIconName,
  outlineName: TabIconName,
) {
  return ({ color, focused }: { color: string; focused: boolean }) => (
    <TabBarIcon name={focused ? focusedName : outlineName} color={color} />
  );
}

/** Hide a file-based route from the tab bar (still reachable via router.push). */
export const hiddenTabOptions = { href: null } as const;
