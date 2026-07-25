import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PollDetailContent } from '@/components/polls/poll-detail-content';
import { ScreenBackButton } from '@/components/ui/screen-back-button';
import { Text } from '@/components/ui/text';
import { useCastVote, usePoll } from '@/hooks/use-polls';
import { useMyMemberships } from '@/hooks/use-society';
import { getPollErrorMessage } from '@/lib/api/polls';
import { resolveApprovedMembership } from '@/lib/api/society';
import { useThemeColors } from '@/lib/theme-colors';

export default function ResidentPollDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const params = useLocalSearchParams<{ id?: string; societyId?: string }>();
  const pollId = typeof params.id === 'string' ? params.id : undefined;

  const memberships = useMyMemberships();
  const membership = useMemo(
    () =>
      resolveApprovedMembership(memberships.data ?? [], {
        societyId: params.societyId,
        role: 'resident',
      }),
    [memberships.data, params.societyId],
  );

  const poll = usePoll({
    id: pollId,
    membershipId: membership?.id,
  });
  const castVote = useCastVote();
  const [voteError, setVoteError] = useState<string | null>(null);

  const handleVote = (optionId: string) => {
    if (!pollId || !membership?.id || !membership.society_id) return;
    if (castVote.isPending || poll.data?.my_vote_option_id) return;
    setVoteError(null);
    castVote.mutate(
      {
        pollId,
        optionId,
        membershipId: membership.id,
        societyId: membership.society_id,
      },
      {
        onError: (err) => {
          setVoteError(getPollErrorMessage(err));
        },
      },
    );
  };

  if (memberships.isLoading || poll.isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator color={colors.roleResident} />
      </View>
    );
  }

  if (!membership) {
    return (
      <View
        className="flex-1 bg-background px-6 justify-center"
        style={{ paddingTop: insets.top }}
      >
        <Text variant="title" className="text-role-resident">
          Poll
        </Text>
        <Text variant="body" tone="muted" className="mt-2">
          No approved resident membership.
        </Text>
      </View>
    );
  }

  if (!poll.data) {
    return (
      <View
        className="flex-1 bg-background px-6 justify-center"
        style={{ paddingTop: insets.top, paddingBottom: insets.bottom + 16 }}
      >
        <Text variant="title" className="text-role-resident">
          Poll not found
        </Text>
        <Text variant="body" tone="muted" className="mt-2">
          This poll may have closed or been removed.
        </Text>
        <ScreenBackButton
          className="mt-6"
          label="Back to polls"
          onPress={() => {
            const href = membership.society_id
              ? (`/(resident)/polls?societyId=${encodeURIComponent(membership.society_id)}` as Href)
              : ('/(resident)/polls' as Href);
            router.replace(href);
          }}
        />
      </View>
    );
  }

  return (
    <View
      className="flex-1 bg-background"
      style={{ paddingTop: insets.top + 8 }}
    >
      <View className="px-6">
        <ScreenBackButton className="mb-4" />
        {voteError ? (
          <Text variant="caption" tone="danger" className="mb-3">
            {voteError}
          </Text>
        ) : null}
      </View>

      <PollDetailContent
        poll={poll.data}
        roleAccentClass="text-role-resident"
        contentPaddingBottom={insets.bottom + 32}
        onVote={handleVote}
        voting={castVote.isPending}
      />
    </View>
  );
}
