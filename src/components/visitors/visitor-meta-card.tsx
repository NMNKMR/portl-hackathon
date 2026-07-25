import type { ComponentProps } from 'react';
import { View } from 'react-native';

import Ionicons from '@react-native-vector-icons/ionicons';

import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { useThemeColors } from '@/lib/theme-colors';

type IonicIconName = ComponentProps<typeof Ionicons>['name'];

export type VisitorMetaRow = {
  icon: IonicIconName;
  label: string;
  value: string;
};

type VisitorMetaCardProps = {
  rows: VisitorMetaRow[];
  className?: string;
};

export function VisitorMetaCard({ rows, className }: VisitorMetaCardProps) {
  const colors = useThemeColors();

  if (rows.length === 0) return null;

  return (
    <View
      className={`overflow-hidden rounded-2xl border border-border bg-card ${className ?? ''}`}
    >
      {rows.map((row, index) => (
        <View
          key={row.label}
          className={`flex-row items-start gap-3 px-4 py-3.5 ${
            index < rows.length - 1 ? 'border-b border-border' : ''
          }`}
        >
          <View className="mt-0.5 h-9 w-9 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800">
            <Icon family="ionic" name={row.icon} size={18} color={colors.primary} />
          </View>
          <View className="min-w-0 flex-1">
            <Text variant="caption" tone="muted">
              {row.label}
            </Text>
            <Text variant="body" className="mt-0.5">
              {row.value}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
}
