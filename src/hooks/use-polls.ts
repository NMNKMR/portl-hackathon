import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from '@tanstack/react-query';

import {
  castVote,
  closePoll,
  createPoll,
  fetchPoll,
  listPollsForSociety,
  type PollWithResults,
} from '@/lib/api/polls';
import { queryKeys } from '@/lib/query-keys';

function applyVoteToPoll(
  poll: PollWithResults,
  pollId: string,
  optionId: string,
): PollWithResults {
  if (poll.id !== pollId) return poll;
  if (poll.my_vote_option_id === optionId) return poll;

  const hadVote = Boolean(poll.my_vote_option_id);
  return {
    ...poll,
    my_vote_option_id: optionId,
    total_votes: hadVote ? poll.total_votes : poll.total_votes + 1,
    options: poll.options.map((option) => ({
      ...option,
      vote_count:
        option.id === optionId && !hadVote
          ? option.vote_count + 1
          : option.vote_count,
    })),
  };
}

function patchPollVoteInCache(
  qc: QueryClient,
  input: {
    societyId: string;
    membershipId: string;
    pollId: string;
    optionId: string;
  },
) {
  qc.setQueryData<PollWithResults[]>(
    queryKeys.polls.bySociety(input.societyId, input.membershipId),
    (old) =>
      old?.map((poll) =>
        applyVoteToPoll(poll, input.pollId, input.optionId),
      ) ?? old,
  );

  qc.setQueryData<PollWithResults>(
    queryKeys.polls.detail(input.pollId, input.membershipId),
    (old) =>
      old ? applyVoteToPoll(old, input.pollId, input.optionId) : old,
  );
}

type VoteMutationContext = {
  previousList?: PollWithResults[];
  previousDetail?: PollWithResults;
};

export function useSocietyPolls(input: {
  societyId: string | undefined;
  membershipId: string | undefined;
}) {
  return useQuery({
    queryKey: queryKeys.polls.bySociety(
      input.societyId ?? '',
      input.membershipId ?? '',
    ),
    queryFn: () =>
      listPollsForSociety(input.societyId!, input.membershipId!),
    enabled: Boolean(input.societyId && input.membershipId),
  });
}

export function usePoll(input: {
  id: string | undefined;
  membershipId: string | undefined;
}) {
  return useQuery({
    queryKey: queryKeys.polls.detail(input.id ?? '', input.membershipId ?? ''),
    queryFn: () => fetchPoll(input.id!, input.membershipId!),
    enabled: Boolean(input.id && input.membershipId),
  });
}

export function useCreatePoll() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createPoll,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.polls.all });
    },
  });
}

export function useCastVote() {
  const qc = useQueryClient();
  return useMutation({
    retry: false,
    mutationFn: (input: {
      pollId: string;
      optionId: string;
      membershipId: string;
      societyId?: string;
    }) => castVote(input),
    onMutate: async (variables): Promise<VoteMutationContext> => {
      if (!variables.societyId) return {};

      const listKey = queryKeys.polls.bySociety(
        variables.societyId,
        variables.membershipId,
      );
      const detailKey = queryKeys.polls.detail(
        variables.pollId,
        variables.membershipId,
      );

      await qc.cancelQueries({ queryKey: listKey });
      await qc.cancelQueries({ queryKey: detailKey });

      const previousList = qc.getQueryData<PollWithResults[]>(listKey);
      const previousDetail = qc.getQueryData<PollWithResults>(detailKey);

      patchPollVoteInCache(qc, {
        societyId: variables.societyId,
        membershipId: variables.membershipId,
        pollId: variables.pollId,
        optionId: variables.optionId,
      });

      return { previousList, previousDetail };
    },
    onSuccess: (result, variables) => {
      if (!variables.societyId) return;
      patchPollVoteInCache(qc, {
        societyId: variables.societyId,
        membershipId: variables.membershipId,
        pollId: variables.pollId,
        optionId: result.option_id,
      });
    },
    onError: (_error, variables, context) => {
      if (!variables.societyId || !context) return;

      const listKey = queryKeys.polls.bySociety(
        variables.societyId,
        variables.membershipId,
      );
      const detailKey = queryKeys.polls.detail(
        variables.pollId,
        variables.membershipId,
      );

      if (context.previousList) {
        qc.setQueryData(listKey, context.previousList);
      }
      if (context.previousDetail) {
        qc.setQueryData(detailKey, context.previousDetail);
      }
    },
  });
}

export function useClosePoll() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: closePoll,
    onSuccess: (data) => {
      void qc.invalidateQueries({ queryKey: queryKeys.polls.all });
      void qc.invalidateQueries({
        queryKey: queryKeys.polls.detail(data.id),
      });
    },
  });
}

export type { PollWithResults };
