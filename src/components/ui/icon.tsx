import Feather from '@react-native-vector-icons/feather';
import Ionicons from '@react-native-vector-icons/ionicons';
import MaterialDesignIcons from '@react-native-vector-icons/material-design-icons';
import MaterialIcons from '@react-native-vector-icons/material-icons';
import type { ComponentProps } from 'react';

/**
 * Icon sets from `@react-native-vector-icons/*` (Expo-recommended).
 * Do NOT use `@expo/vector-icons` (deprecated) or the old umbrella `react-native-vector-icons`.
 */
export const Icons = {
  ionic: Ionicons,
  material: MaterialIcons,
  materialCommunity: MaterialDesignIcons,
  feather: Feather,
} as const;

export type IconFamily = keyof typeof Icons;

type IoniconsName = ComponentProps<typeof Ionicons>['name'];
type MaterialName = ComponentProps<typeof MaterialIcons>['name'];
type MaterialCommunityName = ComponentProps<typeof MaterialDesignIcons>['name'];
type FeatherName = ComponentProps<typeof Feather>['name'];

export type AppIconName =
  | { family: 'ionic'; name: IoniconsName }
  | { family: 'material'; name: MaterialName }
  | { family: 'materialCommunity'; name: MaterialCommunityName }
  | { family: 'feather'; name: FeatherName };

type IconProps = AppIconName & {
  size?: number;
  color?: string;
};

/**
 * Thin wrapper so screens don't import icon families ad hoc.
 * Prefer outline-style names; keep stroke weight consistent within a screen.
 */
export function Icon({ family, name, size = 24, color }: IconProps) {
  const Component = Icons[family];
  return <Component name={name as never} size={size} color={color} />;
}
