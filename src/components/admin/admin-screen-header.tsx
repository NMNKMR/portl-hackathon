import { useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { useThemeColors } from '@/lib/theme-colors';

type AdminScreenHeaderProps = {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  rightSlot?: ReactNode;
};

export function AdminScreenHeader({
  title,
  subtitle,
  onBack,
  rightSlot,
}: AdminScreenHeaderProps) {
  const router = useRouter();
  const colors = useThemeColors();

  return (
    <View className="mb-6">
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1">
          <Pressable
            onPress={onBack ?? (() => router.back())}
            className="mb-3 flex-row items-center gap-1 self-start"
            hitSlop={8}
          >
            <Icon
              family="ionic"
              name="chevron-back"
              size={20}
              color={colors.primary}
            />
            <Text variant="label" tone="primary">
              Back
            </Text>
          </Pressable>
          <Text variant="title" className="text-role-admin">
            {title}
          </Text>
          {subtitle ? (
            <Text variant="body" tone="muted" className="mt-1">
              {subtitle}
            </Text>
          ) : null}
        </View>
        {rightSlot ? <View className="pt-8">{rightSlot}</View> : null}
      </View>
    </View>
  );
}
