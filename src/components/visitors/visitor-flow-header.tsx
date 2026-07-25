import type { ReactNode } from 'react';
import { View } from 'react-native';

import type { DashboardRole } from '@/components/role-dashboard-shell';
import { ScreenBackButton } from '@/components/ui/screen-back-button';
import { Text } from '@/components/ui/text';

function roleAccentClass(role: DashboardRole) {
  if (role === 'admin') return 'text-role-admin';
  if (role === 'guard') return 'text-role-guard';
  return 'text-role-resident';
}

type VisitorFlowHeaderProps = {
  role: DashboardRole;
  title: string;
  subtitle?: string;
  caption?: string;
  showBack?: boolean;
  backLabel?: string;
  onBack?: () => void;
  rightSlot?: ReactNode;
  className?: string;
};

export function VisitorFlowHeader({
  role,
  title,
  subtitle,
  caption,
  showBack = false,
  backLabel,
  onBack,
  rightSlot,
  className,
}: VisitorFlowHeaderProps) {
  return (
    <View className={className}>
      {showBack ? (
        <ScreenBackButton
          className="mb-3"
          label={backLabel}
          onPress={onBack}
        />
      ) : null}

      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1">
          <Text variant="title" className={roleAccentClass(role)}>
            {title}
          </Text>
          {subtitle ? (
            <Text variant="body" tone="muted" className="mt-1">
              {subtitle}
            </Text>
          ) : null}
          {caption ? (
            <Text variant="caption" tone="muted" className="mt-1">
              {caption}
            </Text>
          ) : null}
        </View>
        {rightSlot ? <View className="shrink-0">{rightSlot}</View> : null}
      </View>
    </View>
  );
}
