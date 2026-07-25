import { useLocalSearchParams } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AdminScreenHeader } from '@/components/admin/admin-screen-header';
import { PollDetailContent } from '@/components/polls/poll-detail-content';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { useClosePoll, usePoll } from '@/hooks/use-polls';
import { useMyMemberships } from '@/hooks/use-society';
import { useThemeColors } from '@/lib/theme-colors';

export default function AdminPollDetailScreen() {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const params = useLocalSearchParams<{ id?: string; societyId?: string }>();
  const pollId = typeof params.id === 'string' ? params.id : undefined;

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

  const poll = usePoll({
    id: pollId,
    membershipId: membership?.id,
  });
  const closePoll = useClosePoll();
  const [closeError, setCloseError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      void poll.refetch();
    }, [poll.refetch]),
  );

  const canClose =
    Boolean(poll.data) &&
    Boolean(membership) &&
    poll.data?.created_by_membership_id === membership?.id &&
    poll.data?.is_open;

  const handleClose = async () => {
    if (!pollId) return;
    setCloseError(null);
    try {
      await closePoll.mutateAsync({ id: pollId });
    } catch (err) {
      setCloseError(err instanceof Error ? err.message : 'Could not close poll');
    }
  };

  if (memberships.isLoading || poll.isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator color={colors.roleAdmin} />
      </View>
    );
  }

  if (!membership) {
    return (
      <View
        className="flex-1 bg-background px-6 justify-center"
        style={{ paddingTop: insets.top }}
      >
        <Text variant="title" className="text-role-admin">
          Poll
        </Text>
        <Text variant="body" tone="muted" className="mt-2">
          No approved admin membership.
        </Text>
      </View>
    );
  }

  if (!poll.data) {
    return (
      <View
        className="flex-1 bg-background px-6"
        style={{ paddingTop: insets.top + 12, paddingBottom: insets.bottom + 16 }}
      >
        <AdminScreenHeader
          title="Poll not found"
          subtitle="This poll may have been removed."
          backLabel="Back to polls"
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
        <AdminScreenHeader
          title="Poll"
          subtitle="Society poll results"
          rightSlot={
            canClose ? (
              <Button
                label="Close poll"
                size="sm"
                variant="outlineDanger"
                loading={closePoll.isPending}
                onPress={() => void handleClose()}
              />
            ) : null
          }
        />
        {closeError ? (
          <Text variant="caption" tone="danger" className="mb-2">
            {closeError}
          </Text>
        ) : null}
      </View>

      <PollDetailContent
        poll={poll.data}
        roleAccentClass="text-role-admin"
        contentPaddingBottom={insets.bottom + 32}
      />
    </View>
  );
}
