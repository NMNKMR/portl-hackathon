import { useState } from 'react';
import { Modal, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
  const insets = useSafeAreaInsets();
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

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <Pressable
          className="flex-1 justify-end bg-black/40"
          onPress={() => setOpen(false)}
        >
          <Pressable
            className="rounded-t-3xl bg-background px-4 pt-3"
            style={{ paddingBottom: Math.max(insets.bottom, 16) }}
            onPress={(e) => e.stopPropagation()}
          >
            <View className="mb-3 items-center">
              <View className="h-1 w-10 rounded-full bg-border" />
            </View>
            <Text variant="label" className="mb-3">
              {label}
            </Text>
            <ScrollView style={{ maxHeight: 320 }}>
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
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
