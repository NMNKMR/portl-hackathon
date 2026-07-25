import { Pressable, View } from 'react-native';

import { Badge } from '@/components/ui/badge';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import {
  pollStatusBadge,
  type PollWithResults,
} from '@/lib/api/polls';
import { cn } from '@/lib/cn';
import { formatVisitorListTimestamp } from '@/lib/format';
import { useThemeColors } from '@/lib/theme-colors';

const TAG_CLASS = 'px-1.5 py-0';
const TAG_LABEL_CLASS = 'text-[10px] leading-3';

export type PollCardProps = {
  poll: PollWithResults;
  onPress?: () => void;
  showVoteStatus?: boolean;
  className?: string;
};

function pollSubtitle(poll: PollWithResults): string {
  if (poll.total_votes === 0) {
    return poll.is_open ? 'No votes yet' : 'Closed · no votes';
  }
  const voteLabel = poll.total_votes === 1 ? '1 vote' : `${poll.total_votes} votes`;
  return poll.is_open ? voteLabel : `Closed · ${voteLabel}`;
}

export function PollCard({
  poll,
  onPress,
  showVoteStatus = false,
  className,
}: PollCardProps) {
  const colors = useThemeColors();
  const status = pollStatusBadge(poll);
  const timestamp = formatVisitorListTimestamp(poll.created_at);
  const hasVoted = Boolean(poll.my_vote_option_id);

  const body = (
    <View
      className={cn(
        'mb-3 flex-row items-start gap-3 rounded-2xl border border-border bg-card p-3',
        className,
      )}
    >
      <View className="h-[52px] w-[52px] items-center justify-center rounded-2xl bg-primary/10">
        <Icon family="ionic" name="stats-chart-outline" size={24} color={colors.primary} />
      </View>

      <View className="relative min-h-[52px] min-w-0 flex-1">
        <View className="flex-row items-start gap-2 pr-7">
          <View className="min-w-0 flex-1">
            <Text variant="label" numberOfLines={2}>
              {poll.question}
            </Text>
            <Text variant="caption" tone="muted" className="mt-0.5" numberOfLines={1}>
              {pollSubtitle(poll)}
            </Text>
          </View>
          <View className="max-w-[46%] shrink-0 flex-row flex-wrap justify-end gap-1">
            <Badge
              tone={status.tone}
              label={status.label}
              className={TAG_CLASS}
              labelClassName={TAG_LABEL_CLASS}
            />
            {showVoteStatus && hasVoted ? (
              <Badge
                tone="success"
                label="Voted"
                className={TAG_CLASS}
                labelClassName={TAG_LABEL_CLASS}
              />
            ) : null}
          </View>
        </View>

        {timestamp ? (
          <Text
            variant="caption"
            tone="muted"
            className="mt-2 text-[11px] leading-4 opacity-80"
          >
            Posted · {timestamp}
          </Text>
        ) : null}

        {onPress ? (
          <View className="absolute bottom-0 right-0">
            <Icon family="ionic" name="arrow-forward" size={20} color={colors.muted} />
          </View>
        ) : null}
      </View>
    </View>
  );

  if (!onPress) return body;

  return (
    <Pressable onPress={onPress} accessibilityRole="button" className="active:opacity-90">
      {body}
    </Pressable>
  );
}
