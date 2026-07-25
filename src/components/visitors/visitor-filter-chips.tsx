import { Pressable, View } from 'react-native';

import { Text } from '@/components/ui/text';

type FilterChip<T extends string> = {
  id: T;
  label: string;
};

type VisitorFilterChipsProps<T extends string> = {
  filters: FilterChip<T>[];
  value: T;
  onChange: (value: T) => void;
  activeContainerClassName?: string;
  activeLabelClassName?: string;
};

export function VisitorFilterChips<T extends string>({
  filters,
  value,
  onChange,
  activeContainerClassName = 'border-role-guard bg-role-guard/15',
  activeLabelClassName = 'text-role-guard',
}: VisitorFilterChipsProps<T>) {
  return (
    <View className="flex-row flex-wrap gap-2">
      {filters.map((chip) => {
        const active = value === chip.id;
        return (
          <Pressable
            key={chip.id}
            onPress={() => onChange(chip.id)}
            className={`rounded-full border px-3.5 py-1.5 ${
              active ? activeContainerClassName : 'border-border bg-card'
            }`}
          >
            <Text
              variant="caption"
              className={active ? activeLabelClassName : undefined}
              tone={active ? undefined : 'muted'}
            >
              {chip.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
