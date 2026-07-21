import { cva, type VariantProps } from 'class-variance-authority';
import {
  ActivityIndicator,
  Pressable,
  type PressableProps,
  View,
} from 'react-native';

import { Text } from '@/components/ui/text';
import { cn } from '@/lib/cn';
import { useThemeColors } from '@/lib/theme-colors';

const buttonVariants = cva(
  'flex-row items-center justify-center rounded-xl px-4',
  {
    variants: {
      variant: {
        primary: 'bg-primary active:opacity-90',
        secondary: 'bg-neutral-200 dark:bg-neutral-700 active:opacity-90',
        outline:
          'border border-border bg-transparent active:bg-neutral-100 dark:active:bg-neutral-800',
        ghost:
          'bg-transparent active:bg-neutral-100 dark:active:bg-neutral-800',
        accent: 'bg-accent active:opacity-90',
        danger: 'bg-danger active:opacity-90',
      },
      size: {
        sm: 'h-10',
        md: 'h-12',
        lg: 'h-14',
      },
      fullWidth: {
        true: 'w-full',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
      fullWidth: false,
    },
  },
);

const buttonTextTone: Record<
  NonNullable<VariantProps<typeof buttonVariants>['variant']>,
  'inverse' | 'default' | 'danger' | 'primary'
> = {
  primary: 'inverse',
  secondary: 'default',
  outline: 'primary',
  ghost: 'primary',
  accent: 'inverse',
  danger: 'inverse',
};

export type ButtonProps = PressableProps &
  VariantProps<typeof buttonVariants> & {
    className?: string;
    label: string;
    loading?: boolean;
  };

export function Button({
  className,
  variant = 'primary',
  size,
  fullWidth,
  label,
  loading = false,
  disabled,
  ...props
}: ButtonProps) {
  const colors = useThemeColors();
  const isDisabled = disabled || loading;
  const tone = buttonTextTone[variant ?? 'primary'];

  return (
    <Pressable
      accessibilityRole="button"
      disabled={isDisabled}
      className={cn(
        buttonVariants({ variant, size, fullWidth }),
        isDisabled && 'opacity-50',
        className,
      )}
      {...props}
    >
      <View className="flex-row items-center gap-2">
        {loading ? (
          <ActivityIndicator
            color={tone === 'inverse' ? colors.onPrimary : colors.primary}
          />
        ) : null}
        <Text variant="label" tone={tone}>
          {label}
        </Text>
      </View>
    </Pressable>
  );
}
