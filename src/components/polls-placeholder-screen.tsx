import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ScreenBackButton } from '@/components/ui/screen-back-button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { useThemeColors } from '@/lib/theme-colors';

type PollsPlaceholderScreenProps = {
  titleClassName: string;
  subtitle?: string;
};

export function PollsPlaceholderScreen({
  titleClassName,
  subtitle = 'Polls are next — create and vote will land here soon.',
}: PollsPlaceholderScreenProps) {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();

  return (
    <View
      className="flex-1 bg-background px-6"
      style={{ paddingTop: insets.top + 16 }}
    >
      <ScreenBackButton className="mb-4" />
      <Text variant="title" className={titleClassName}>
        Polls
      </Text>
      <View className="flex-1 items-center justify-center pb-16">
        <View className="mb-4 h-16 w-16 items-center justify-center rounded-full bg-card border border-border">
          <Icon
            family="ionic"
            name="stats-chart-outline"
            size={28}
            color={colors.muted}
          />
        </View>
        <Text variant="body" tone="muted" className="text-center px-4">
          {subtitle}
        </Text>
      </View>
    </View>
  );
}
