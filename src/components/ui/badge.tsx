import { cva, type VariantProps } from 'class-variance-authority';
import { View } from 'react-native';

import { Text } from '@/components/ui/text';
import { cn } from '@/lib/cn';

const badgeVariants = cva('self-start rounded-full px-2.5 py-1', {
  variants: {
    tone: {
      pending: 'bg-accent/15',
      success: 'bg-success/15',
      danger: 'bg-danger/15',
      muted: 'bg-neutral-100 dark:bg-neutral-800',
    },
  },
  defaultVariants: {
    tone: 'muted',
  },
});

const badgeTextTone: Record<
  NonNullable<VariantProps<typeof badgeVariants>['tone']>,
  'accent' | 'success' | 'danger' | 'muted'
> = {
  pending: 'accent',
  success: 'success',
  danger: 'danger',
  muted: 'muted',
};

type BadgeProps = VariantProps<typeof badgeVariants> & {
  label: string;
  className?: string;
  labelClassName?: string;
};

export function Badge({
  tone = 'muted',
  label,
  className,
  labelClassName,
}: BadgeProps) {
  return (
    <View className={cn(badgeVariants({ tone }), className)}>
      <Text
        variant="caption"
        tone={badgeTextTone[tone ?? 'muted']}
        className={cn('capitalize', labelClassName)}
      >
        {label}
      </Text>
    </View>
  );
}
