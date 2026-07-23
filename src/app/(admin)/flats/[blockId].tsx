import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AdminScreenHeader } from '@/components/admin/admin-screen-header';
import { FlatRangePanel } from '@/components/admin/flat-range-panel';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { useAdminSocietyId } from '@/hooks/use-admin-society-id';
import {
  useCreateFlatsInRange,
  useSociety,
  useSocietyBlocks,
  useSocietyFlats,
} from '@/hooks/use-society';
import { useThemeColors } from '@/lib/theme-colors';

export default function BlockFlatsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const params = useLocalSearchParams<{ blockId?: string }>();
  const { societyId, isLoading: societyIdLoading } = useAdminSocietyId();

  const society = useSociety(societyId);
  const blocks = useSocietyBlocks(societyId);
  const flats = useSocietyFlats(societyId);
  const createRange = useCreateFlatsInRange();

  const [error, setError] = useState<string | null>(null);

  const blockId = params.blockId;
  const block = useMemo(
    () => (blocks.data ?? []).find((item) => item.id === blockId),
    [blocks.data, blockId],
  );

  const blockFlats = useMemo(() => {
    if (!blockId) return [];
    return (flats.data ?? [])
      .filter((flat) => flat.block_id === blockId)
      .sort((a, b) =>
        a.flat_number.localeCompare(b.flat_number, undefined, {
          numeric: true,
        }),
      );
  }, [flats.data, blockId]);

  const isLoading =
    societyIdLoading || blocks.isLoading || flats.isLoading || society.isLoading;

  const handleCreateRange = async (start: string, end: string) => {
    if (!societyId || !blockId) return;
    setError(null);
    try {
      await createRange.mutateAsync({
        societyId,
        start,
        end,
        blockId,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create flats');
    }
  };

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!societyId || !blockId || !block) {
    return (
      <View
        className="flex-1 bg-background px-6 justify-center"
        style={{ paddingBottom: insets.bottom + 16 }}
      >
        <Text variant="title">Block not found</Text>
        <Button
          className="mt-6"
          label="Back"
          fullWidth
          onPress={() => router.back()}
        />
      </View>
    );
  }

  const flatLabel = blockFlats.length === 1 ? 'flat' : 'flats';

  return (
    <View
      className="flex-1 bg-background px-6"
      style={{ paddingTop: insets.top + 16, paddingBottom: insets.bottom + 16 }}
    >
      <AdminScreenHeader
        title={block.name}
        subtitle={society.data?.name ?? 'Society'}
      />

      <Text variant="label" className="mb-3">
        Flats ({blockFlats.length} {flatLabel})
      </Text>

      <View className="min-h-[180px] flex-1 overflow-hidden rounded-xl border border-border">
        <FlatList
          data={blockFlats}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{
            flexGrow: 1,
            padding: 8,
            paddingBottom: 12,
          }}
          ListEmptyComponent={
            <Text variant="body" tone="muted" className="px-2 py-4">
              No flats in this block yet. Add a range below.
            </Text>
          }
          renderItem={({ item }) => (
            <View className="mb-2 flex-row items-center rounded-xl border border-border bg-card px-4 py-3">
              <Text variant="label" className="flex-1">
                {item.flat_number}
              </Text>
              <Icon
                family="ionic"
                name="chevron-forward"
                size={18}
                color={colors.muted}
              />
            </View>
          )}
        />
      </View>

      <View className="mt-4">
        <FlatRangePanel
          loading={createRange.isPending}
          onCreateRange={(start, end) => void handleCreateRange(start, end)}
        />
        {error ? (
          <Text variant="caption" tone="danger" className="mt-3">
            {error}
          </Text>
        ) : null}
      </View>
    </View>
  );
}
