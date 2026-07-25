import { Pressable, ScrollView, View } from 'react-native';

import { PollResultBar } from '@/components/polls/poll-result-bar';
import { Badge } from '@/components/ui/badge';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { pollStatusBadge, type PollWithResults } from '@/lib/api/polls';
import { cn } from '@/lib/cn';
import { formatJoinDate } from '@/lib/format';
import { useThemeColors } from '@/lib/theme-colors';

export type PollDetailContentProps = {
  poll: PollWithResults;
  roleAccentClass: 'text-role-admin' | 'text-role-resident';
  contentPaddingBottom: number;
  onVote?: (optionId: string) => void;
  voting?: boolean;
};

function optionPercentage(count: number, total: number): number {
  if (total <= 0) return 0;
  return (count / total) * 100;
}

export function PollDetailContent({
  poll,
  roleAccentClass,
  contentPaddingBottom,
  onVote,
  voting = false,
}: PollDetailContentProps) {
  const colors = useThemeColors();
  const status = pollStatusBadge(poll);
  const canVote = Boolean(onVote);
  const hasVoted = Boolean(poll.my_vote_option_id);
  const showVoteOptions = canVote && poll.is_open && !hasVoted;

  return (
    <ScrollView
      className="flex-1"
      contentContainerStyle={{
        paddingHorizontal: 24,
        paddingBottom: contentPaddingBottom,
      }}
    >
      <View className="h-40 w-full items-center justify-center rounded-2xl bg-primary/10">
        <Icon family="ionic" name="stats-chart-outline" size={56} color={colors.primary} />
      </View>

      <View className="mt-4 flex-row flex-wrap items-center gap-2">
        <Badge tone={status.tone} label={status.label} />
        {canVote && hasVoted ? (
          <Badge tone="success" label="You voted" />
        ) : null}
      </View>

      <Text variant="title" className={cn('mt-3', roleAccentClass)}>
        {poll.question}
      </Text>

      <Text variant="caption" tone="muted" className="mt-2">
        {poll.total_votes === 0
          ? 'No votes yet'
          : poll.total_votes === 1
            ? '1 vote'
            : `${poll.total_votes} votes`}
      </Text>

      <View className="mt-6 gap-3">
        {showVoteOptions
          ? poll.options.map((option) => (
              <Pressable
                key={option.id}
                accessibilityRole="button"
                disabled={voting}
                onPress={() => onVote?.(option.id)}
                className={cn(
                  'rounded-xl border border-border bg-card px-4 py-3 active:opacity-90',
                  voting && 'opacity-60',
                )}
              >
                <View className="flex-row items-center gap-3">
                  <View className="h-5 w-5 rounded-full border-2 border-primary" />
                  <Text variant="body" className="min-w-0 flex-1">
                    {option.option_text}
                  </Text>
                </View>
              </Pressable>
            ))
          : poll.options.map((option) => (
              <PollResultBar
                key={option.id}
                label={option.option_text}
                count={option.vote_count}
                percentage={optionPercentage(option.vote_count, poll.total_votes)}
                selected={option.id === poll.my_vote_option_id}
              />
            ))}
      </View>

      <View className="mt-6 rounded-xl border border-border bg-card px-4 py-3">
        <Text variant="caption" tone="muted">
          Posted {formatJoinDate(poll.created_at)}
        </Text>
        {poll.closes_at ? (
          <Text variant="caption" tone="muted" className="mt-1">
            {poll.is_open
              ? `Closes ${formatJoinDate(poll.closes_at)}`
              : `Closed ${formatJoinDate(poll.closes_at)}`}
          </Text>
        ) : (
          <Text variant="caption" tone="muted" className="mt-1">
            No auto-close
          </Text>
        )}
      </View>
    </ScrollView>
  );
}
