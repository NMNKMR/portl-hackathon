import { cva, type VariantProps } from 'class-variance-authority';
import { Text as RNText, type TextProps as RNTextProps } from 'react-native';

import { cn } from '@/lib/cn';

const textVariants = cva('text-foreground font-sans', {
  variants: {
    variant: {
      display: 'text-3xl font-sans-bold',
      title: 'text-2xl font-sans-bold',
      subtitle: 'text-lg font-sans-semibold',
      body: 'text-base font-sans',
      caption: 'text-sm font-sans',
      label: 'text-sm font-sans-medium',
    },
    tone: {
      default: 'text-foreground',
      muted: 'text-muted',
      primary: 'text-primary',
      accent: 'text-accent',
      danger: 'text-danger',
      success: 'text-success',
      inverse: 'text-white',
    },
    align: {
      left: 'text-left',
      center: 'text-center',
      right: 'text-right',
    },
  },
  defaultVariants: {
    variant: 'body',
    tone: 'default',
    align: 'left',
  },
});

export type TextVariants = VariantProps<typeof textVariants>;

export type TextProps = RNTextProps &
  TextVariants & {
    className?: string;
  };

export function Text({
  className,
  variant,
  tone,
  align,
  ...props
}: TextProps) {
  return (
    <RNText
      className={cn(textVariants({ variant, tone, align }), className)}
      {...props}
    />
  );
}
