import { Pressable, View } from 'react-native';

import { Icon, type AppIconName } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/cn';
import { useThemeColors } from '@/lib/theme-colors';

export type SegmentedOption<T extends string> = {
  value: T;
  label: string;
  icon?: AppIconName;
};

type SegmentedControlProps<T extends string> = {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
};

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  className,
}: SegmentedControlProps<T>) {
  const colors = useThemeColors();

  return (
    <View className={cn('flex-row gap-2', className)}>
      {options.map((option) => {
        const selected = value === option.value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            onPress={() => onChange(option.value)}
            className={cn(
              'min-h-12 flex-1 flex-row items-center justify-center gap-2 rounded-xl border px-3 py-2.5',
              selected
                ? 'border-primary bg-primary/10'
                : 'border-border bg-card',
            )}
          >
            {option.icon ? (
              <Icon
                {...option.icon}
                size={18}
                color={selected ? colors.primary : colors.muted}
              />
            ) : null}
            <Text
              variant="label"
              tone={selected ? 'primary' : 'default'}
              className="capitalize"
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
