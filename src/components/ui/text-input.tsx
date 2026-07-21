import { cva, type VariantProps } from 'class-variance-authority';
import { useState } from 'react';
import {
  TextInput as RNTextInput,
  View,
  type TextInputProps as RNTextInputProps,
} from 'react-native';

import { Text } from '@/components/ui/text';
import { cn } from '@/lib/cn';
import { useThemeColors } from '@/lib/theme-colors';

const inputVariants = cva(
  'w-full rounded-xl border bg-card px-4 text-base text-foreground font-sans',
  {
    variants: {
      size: {
        sm: 'h-10',
        md: 'h-12',
        lg: 'h-14',
      },
      state: {
        default: 'border-border',
        error: 'border-danger',
        disabled: 'border-border opacity-50',
      },
    },
    defaultVariants: {
      size: 'md',
      state: 'default',
    },
  },
);

export type TextInputProps = Omit<RNTextInputProps, 'editable'> &
  VariantProps<typeof inputVariants> & {
    className?: string;
    label?: string;
    helperText?: string;
    error?: string;
    disabled?: boolean;
  };

export function TextInput({
  className,
  size,
  state,
  label,
  helperText,
  error,
  disabled = false,
  onFocus,
  onBlur,
  ...props
}: TextInputProps) {
  const colors = useThemeColors();
  const [focused, setFocused] = useState(false);
  const resolvedState = disabled ? 'disabled' : error ? 'error' : state;

  return (
    <View className="w-full gap-1.5">
      {label ? (
        <Text variant="label" tone="muted">
          {label}
        </Text>
      ) : null}
      <RNTextInput
        editable={!disabled}
        placeholderTextColor={colors.placeholder}
        className={cn(
          inputVariants({ size, state: resolvedState }),
          focused && !error && !disabled && 'border-primary',
          className,
        )}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
        {...props}
      />
      {error ? (
        <Text variant="caption" tone="danger">
          {error}
        </Text>
      ) : helperText ? (
        <Text variant="caption" tone="muted">
          {helperText}
        </Text>
      ) : null}
    </View>
  );
}
