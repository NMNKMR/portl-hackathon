import { useMemo, useState } from 'react';
import { View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { TextInput } from '@/components/ui/text-input';
import {
  formatRangePreview,
  MAX_FLAT_RANGE_SIZE,
  parseNumericFlatRange,
} from '@/lib/flat-range';
import { useThemeColors } from '@/lib/theme-colors';

type FlatRangePanelProps = {
  loading?: boolean;
  onCreateRange: (start: string, end: string) => void;
};

export function FlatRangePanel({
  loading = false,
  onCreateRange,
}: FlatRangePanelProps) {
  const colors = useThemeColors();
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [error, setError] = useState<string | null>(null);

  const preview = useMemo(() => parseNumericFlatRange(start, end), [start, end]);

  const handleCreate = () => {
    if (preview.error) {
      setError(preview.error);
      return;
    }
    setError(null);
    onCreateRange(start.trim(), end.trim());
    setStart('');
    setEnd('');
  };

  return (
    <View className="rounded-xl border border-border bg-card px-4 pb-4 pt-3">
      <Text variant="label">Add flats in range</Text>
      <Text variant="caption" tone="muted" className="mt-1">
        Enter a numeric start and end. Maximum {MAX_FLAT_RANGE_SIZE} flats per
        range.
      </Text>

      <View className="mt-3 flex-row gap-3">
        <View className="flex-1">
          <TextInput
            label="Start flat number"
            placeholder="1201"
            value={start}
            onChangeText={(value) => {
              setStart(value);
              setError(null);
            }}
            keyboardType="number-pad"
          />
        </View>
        <View className="flex-1">
          <TextInput
            label="End flat number"
            placeholder="1210"
            value={end}
            onChangeText={(value) => {
              setEnd(value);
              setError(null);
            }}
            keyboardType="number-pad"
          />
        </View>
      </View>

      {preview.numbers.length > 0 ? (
        <View className="mt-3 rounded-xl border border-success/30 bg-success/10 px-4 py-3">
          <View className="flex-row items-center gap-2">
            <Icon
              family="ionic"
              name="checkmark-circle"
              size={18}
              color={colors.success}
            />
            <Text variant="label" tone="success">
              Creates {preview.numbers.length} flats
            </Text>
          </View>
          <Text variant="caption" tone="muted" className="mt-1">
            {formatRangePreview(preview.numbers)}
          </Text>
        </View>
      ) : null}

      {error ? (
        <Text variant="caption" tone="danger" className="mt-2">
          {error}
        </Text>
      ) : null}

      <Button
        className="mt-4"
        label="Create range"
        fullWidth
        loading={loading}
        disabled={preview.numbers.length === 0}
        onPress={handleCreate}
      />
    </View>
  );
}
