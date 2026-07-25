import { View } from 'react-native';

import { Text } from '@/components/ui/text';
import { cn } from '@/lib/cn';

export type PollResultBarProps = {
  label: string;
  count: number;
  percentage: number;
  selected?: boolean;
  className?: string;
};

export function PollResultBar({
  label,
  count,
  percentage,
  selected = false,
  className,
}: PollResultBarProps) {
  const clampedPercent = Math.min(100, Math.max(0, percentage));

  return (
    <View className={cn('gap-1.5', className)}>
      <View className="flex-row items-center justify-between gap-2">
        <Text
          variant="label"
          numberOfLines={2}
          className={cn('min-w-0 flex-1', selected && 'text-primary')}
        >
          {label}
        </Text>
        <Text variant="caption" tone="muted" className="shrink-0">
          {count} · {Math.round(clampedPercent)}%
        </Text>
      </View>
      <View className="h-2 overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
        <View
          className={cn(
            'h-full rounded-full',
            selected ? 'bg-primary' : 'bg-primary/35',
          )}
          style={{ width: `${clampedPercent}%` }}
        />
      </View>
    </View>
  );
}
