import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PollCard } from '@/components/polls/poll-card';
import { PollFormSheet } from '@/components/polls/poll-form-sheet';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { useSocietyPolls } from '@/hooks/use-polls';
import { useMyMemberships } from '@/hooks/use-society';
import type { PollWithResults } from '@/lib/api/polls';
import { useThemeColors } from '@/lib/theme-colors';

export default function AdminPollsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const params = useLocalSearchParams<{ societyId?: string }>();
  const memberships = useMyMemberships();

  const membership = useMemo(() => {
    const rows = memberships.data ?? [];
    if (params.societyId) {
      return rows.find(
        (m) =>
          m.society_id === params.societyId &&
          m.role === 'admin' &&
          m.status === 'approved',
      );
    }
    return rows.find((m) => m.role === 'admin' && m.status === 'approved');
  }, [memberships.data, params.societyId]);

  const societyId = membership?.society_id;
  const polls = useSocietyPolls({
    societyId,
    membershipId: membership?.id,
  });

  const [sheetOpen, setSheetOpen] = useState(false);

  const openDetail = (poll: PollWithResults) => {
    const href = societyId
      ? (`/(admin)/polls/${poll.id}?societyId=${encodeURIComponent(societyId)}` as Href)
      : (`/(admin)/polls/${poll.id}` as Href);
    router.push(href);
  };

  if (memberships.isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!societyId || !membership) {
    return (
      <View className="flex-1 bg-background px-6 justify-center">
        <Text variant="title" className="text-role-admin">
          Polls
        </Text>
        <Text variant="body" tone="muted" className="mt-2">
          No approved admin membership.
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <View
        className="flex-1 px-5"
        style={{ paddingTop: insets.top + 12 }}
      >
        <View className="mb-4 flex-row items-start justify-between gap-3">
          <View className="flex-1">
            <Text variant="title" className="text-role-admin">
              Polls
            </Text>
            <Text variant="body" tone="muted" className="mt-1">
              Create and manage society polls
            </Text>
          </View>
          <Button
            label="Compose"
            size="sm"
            variant="accent"
            onPress={() => setSheetOpen(true)}
          />
        </View>

        {polls.isLoading ? (
          <ActivityIndicator color={colors.roleAdmin} />
        ) : (
          <FlatList
            data={polls.data ?? []}
            keyExtractor={(item) => item.id}
            refreshing={polls.isRefetching}
            onRefresh={() => void polls.refetch()}
            contentContainerStyle={{ paddingBottom: 24, flexGrow: 1 }}
            ListEmptyComponent={
              <View className="items-center py-16">
                <Text variant="body" tone="muted">
                  No polls yet.
                </Text>
              </View>
            }
            renderItem={({ item }) => (
              <PollCard poll={item} onPress={() => openDetail(item)} />
            )}
          />
        )}
      </View>

      <PollFormSheet
        visible={sheetOpen}
        onClose={() => setSheetOpen(false)}
        societyId={societyId}
        membershipId={membership.id}
      />
    </View>
  );
}
