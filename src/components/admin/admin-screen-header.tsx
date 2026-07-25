import type { ReactNode } from 'react';
import { View } from 'react-native';

import { ScreenBackButton } from '@/components/ui/screen-back-button';
import { Text } from '@/components/ui/text';

type AdminScreenHeaderProps = {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  backLabel?: string;
  rightSlot?: ReactNode;
};

export function AdminScreenHeader({
  title,
  subtitle,
  onBack,
  backLabel,
  rightSlot,
}: AdminScreenHeaderProps) {
  return (
    <View className="mb-6">
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1">
          <ScreenBackButton
            className="mb-3"
            label={backLabel}
            onPress={onBack}
          />
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
