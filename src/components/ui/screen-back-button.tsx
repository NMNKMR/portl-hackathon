import { useRouter } from 'expo-router';
import { Pressable, type PressableProps } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/cn';
import { useThemeColors } from '@/lib/theme-colors';

type ScreenBackButtonProps = Omit<PressableProps, 'onPress' | 'children'> & {
  label?: string;
  onPress?: () => void;
  className?: string;
};

/**
 * Standard in-app back control — chevron + label. Use on all non-auth stack screens.
 */
export function ScreenBackButton({
  label = 'Back',
  onPress,
  className,
  ...props
}: ScreenBackButtonProps) {
  const router = useRouter();
  const colors = useThemeColors();

  const handlePress =
    onPress ??
    (() => {
      if (router.canGoBack()) {
        router.back();
      }
    });

  return (
    <Pressable
      onPress={handlePress}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={label}
      className={cn('flex-row items-center gap-1 self-start', className)}
      {...props}
    >
      <Icon
        family="ionic"
        name="chevron-back"
        size={20}
        color={colors.primary}
      />
      <Text variant="label" tone="primary">
        {label}
      </Text>
    </Pressable>
  );
}
