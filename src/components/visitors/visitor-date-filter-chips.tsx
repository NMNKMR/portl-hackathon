import { Pressable, View } from 'react-native';

import { Text } from '@/components/ui/text';

import {
  VISITOR_DATE_FILTERS,
  type VisitorDateRange,
} from '@/lib/visitor-filters';

type VisitorDateFilterChipsProps = {
  value: VisitorDateRange;
  onChange: (value: VisitorDateRange) => void;
  activeContainerClassName?: string;
  activeLabelClassName?: string;
};

export function VisitorDateFilterChips({
  value,
  onChange,
  activeContainerClassName = 'border-primary bg-primary/10',
  activeLabelClassName = 'text-primary',
}: VisitorDateFilterChipsProps) {
  return (
    <View className="flex-row flex-wrap gap-2">
      {VISITOR_DATE_FILTERS.map((chip) => {
        const active = value === chip.id;
        return (
          <Pressable
            key={chip.id}
            onPress={() => onChange(chip.id)}
            className={`rounded-full border px-3 py-1.5 ${
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
