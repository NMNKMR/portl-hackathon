import { cva, type VariantProps } from 'class-variance-authority';
import {
  ActivityIndicator,
  Pressable,
  type PressableProps,
  View,
} from 'react-native';

import { Text } from '@/components/ui/text';
import { Icon, type AppIconName } from '@/components/ui/icon';
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
        outlineDanger:
          'border border-danger bg-transparent active:bg-danger/10',
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
  outlineDanger: 'danger',
  ghost: 'primary',
  accent: 'inverse',
  danger: 'inverse',
};

const buttonIconSize: Record<
  NonNullable<VariantProps<typeof buttonVariants>['size']>,
  number
> = {
  sm: 18,
  md: 20,
  lg: 22,
};

function iconColorForTone(
  tone: (typeof buttonTextTone)[keyof typeof buttonTextTone],
  colors: ReturnType<typeof useThemeColors>,
): string {
  switch (tone) {
    case 'inverse':
      return colors.onPrimary;
    case 'primary':
      return colors.primary;
    case 'danger':
      return colors.danger;
    default:
      return colors.foreground;
  }
}

export type ButtonProps = PressableProps &
  VariantProps<typeof buttonVariants> & {
    className?: string;
    label: string;
    loading?: boolean;
    icon?: AppIconName;
    iconPosition?: 'left' | 'right';
  };

export function Button({
  className,
  variant = 'primary',
  size = 'md',
  fullWidth,
  label,
  loading = false,
  disabled,
  icon,
  iconPosition = 'left',
  ...props
}: ButtonProps) {
  const colors = useThemeColors();
  const isDisabled = disabled || loading;
  const tone = buttonTextTone[variant ?? 'primary'];
  const iconColor = iconColorForTone(tone, colors);
  const iconSize = buttonIconSize[size ?? 'md'];

  const leadingIcon =
    !loading && icon && iconPosition === 'left' ? (
      <Icon {...icon} size={iconSize} color={iconColor} />
    ) : null;
  const trailingIcon =
    !loading && icon && iconPosition === 'right' ? (
      <Icon {...icon} size={iconSize} color={iconColor} />
    ) : null;

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
        {leadingIcon}
        <Text variant="label" tone={tone}>
          {label}
        </Text>
        {trailingIcon}
      </View>
    </Pressable>
  );
}
