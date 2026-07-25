import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';

import { AppBottomSheet } from '@/components/ui/bottom-sheet';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { useThemeColors } from '@/lib/theme-colors';

export type SelectOption = {
  value: string;
  label: string;
};

type SelectFieldProps = {
  label: string;
  placeholder?: string;
  value: string | null;
  options: SelectOption[];
  disabled?: boolean;
  emptyMessage?: string;
  onChange: (value: string) => void;
};

export function SelectField({
  label,
  placeholder = 'Select…',
  value,
  options,
  disabled = false,
  emptyMessage = 'Nothing to select',
  onChange,
}: SelectFieldProps) {
  const [open, setOpen] = useState(false);
  const colors = useThemeColors();
  const selected = options.find((o) => o.value === value);

  return (
    <View>
      <Text variant="label" className="mb-2">
        {label}
      </Text>
      <Pressable
        disabled={disabled || options.length === 0}
        onPress={() => setOpen(true)}
        className={`h-12 flex-row items-center justify-between rounded-xl border border-border bg-card px-4 ${
          disabled || options.length === 0 ? 'opacity-50' : ''
        }`}
      >
        <Text
          variant="body"
          tone={selected ? 'default' : 'muted'}
          className="flex-1 pr-2"
          numberOfLines={1}
        >
          {options.length === 0
            ? emptyMessage
            : (selected?.label ?? placeholder)}
        </Text>
        <Icon
          family="ionic"
          name="chevron-down"
          size={18}
          color={colors.muted}
        />
      </Pressable>

      <AppBottomSheet
        visible={open}
        onClose={() => setOpen(false)}
        title={label}
        snapPoints={['42%', '65%']}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          style={{ maxHeight: 320 }}
          showsVerticalScrollIndicator={false}
        >
          {options.map((option) => {
            const isSelected = option.value === value;
            return (
              <Pressable
                key={option.value}
                className={`mb-2 rounded-xl border px-4 py-3 ${
                  isSelected
                    ? 'border-primary bg-primary/10'
                    : 'border-border bg-card'
                }`}
                onPress={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
              >
                <Text variant="label">{option.label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </AppBottomSheet>
    </View>
  );
}
