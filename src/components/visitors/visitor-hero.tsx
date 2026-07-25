import { Image } from 'expo-image';
import { View } from 'react-native';

import { Badge } from '@/components/ui/badge';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import {
  visitorStatusBadgeTone,
  visitorStatusLabel,
} from '@/lib/visitor-status';
import { useThemeColors } from '@/lib/theme-colors';
import type { VisitorStatus } from '@/types/database';

type VisitorHeroProps = {
  name: string;
  photoUrl?: string | null;
  status: VisitorStatus;
  subtitle?: string;
  /** Full-width banner vs centered compact hero */
  variant?: 'banner' | 'compact';
};

export function VisitorHero({
  name,
  photoUrl,
  status,
  subtitle,
  variant = 'banner',
}: VisitorHeroProps) {
  const colors = useThemeColors();
  const tone = visitorStatusBadgeTone(status);
  const label = visitorStatusLabel(status);

  if (variant === 'compact') {
    return (
      <View className="items-center">
        {photoUrl ? (
          <Image
            source={{ uri: photoUrl }}
            style={{ width: 128, height: 128, borderRadius: 20 }}
            contentFit="cover"
            accessibilityLabel={`${name} photo`}
          />
        ) : (
          <View className="h-32 w-32 items-center justify-center rounded-2xl bg-primary/10">
            <Icon
              family="ionic"
              name="person-outline"
              size={44}
              color={colors.primary}
            />
          </View>
        )}

        <Text variant="title" className="mt-4 text-center">
          {name}
        </Text>
        {subtitle ? (
          <Text variant="caption" tone="muted" className="mt-1 text-center">
            {subtitle}
          </Text>
        ) : null}
        <View className="mt-2">
          <Badge tone={tone} label={label} />
        </View>
      </View>
    );
  }

  return (
    <View className="overflow-hidden rounded-2xl border border-border bg-card">
      {photoUrl ? (
        <Image
          source={{ uri: photoUrl }}
          style={{ width: '100%', height: 200 }}
          contentFit="cover"
          accessibilityLabel={`${name} photo`}
        />
      ) : (
        <View className="h-48 w-full items-center justify-center bg-primary/10">
          <Icon
            family="ionic"
            name="person-outline"
            size={48}
            color={colors.primary}
          />
          <Text variant="caption" tone="muted" className="mt-2">
            No photo
          </Text>
        </View>
      )}

      <View className="px-4 py-4">
        <View className="flex-row items-start justify-between gap-3">
          <View className="min-w-0 flex-1">
            <Text variant="subtitle">{name}</Text>
            {subtitle ? (
              <Text variant="caption" tone="muted" className="mt-0.5">
                {subtitle}
              </Text>
            ) : null}
          </View>
          <Badge tone={tone} label={label} />
        </View>
      </View>
    </View>
  );
}
