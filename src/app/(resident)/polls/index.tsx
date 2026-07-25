import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { useMemo } from 'react';
import {
  ActivityIndicator,
  FlatList,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PollCard } from '@/components/polls/poll-card';
import { Text } from '@/components/ui/text';
import { useSocietyPolls } from '@/hooks/use-polls';
import { useMyMemberships } from '@/hooks/use-society';
import type { PollWithResults } from '@/lib/api/polls';
import { resolveApprovedMembership } from '@/lib/api/society';
import { useThemeColors } from '@/lib/theme-colors';

export default function ResidentPollsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const params = useLocalSearchParams<{ societyId?: string }>();
  const memberships = useMyMemberships();

  const membership = useMemo(
    () =>
      resolveApprovedMembership(memberships.data ?? [], {
        societyId: params.societyId,
        role: 'resident',
      }),
    [memberships.data, params.societyId],
  );

  const polls = useSocietyPolls({
    societyId: membership?.society_id,
    membershipId: membership?.id,
  });

  const openPolls = useMemo(
    () => (polls.data ?? []).filter((poll) => poll.is_open),
    [polls.data],
  );

  const openDetail = (poll: PollWithResults) => {
    const href = membership?.society_id
      ? (`/(resident)/polls/${poll.id}?societyId=${encodeURIComponent(membership.society_id)}` as Href)
      : (`/(resident)/polls/${poll.id}` as Href);
    router.push(href);
  };

  if (memberships.isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!membership?.society_id) {
    return (
      <View className="flex-1 bg-background px-6 justify-center">
        <Text variant="title" className="text-role-resident">
          Polls
        </Text>
        <Text variant="body" tone="muted" className="mt-2">
          No approved resident membership.
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
        <Text variant="title" className="text-role-resident">
          Polls
        </Text>
        <Text variant="body" tone="muted" className="mt-1 mb-4">
          Open polls from your society
        </Text>

        {polls.isLoading ? (
          <ActivityIndicator color={colors.roleResident} />
        ) : (
          <FlatList
            data={openPolls}
            keyExtractor={(item) => item.id}
            refreshing={polls.isRefetching}
            onRefresh={() => void polls.refetch()}
            contentContainerStyle={{ paddingBottom: 24, flexGrow: 1 }}
            ListEmptyComponent={
              <View className="items-center py-16">
                <Text variant="body" tone="muted">
                  No open polls.
                </Text>
              </View>
            }
            renderItem={({ item }) => (
              <PollCard
                poll={item}
                showVoteStatus
                onPress={() => openDetail(item)}
              />
            )}
          />
        )}
      </View>
    </View>
  );
}
