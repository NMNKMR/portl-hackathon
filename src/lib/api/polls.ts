import { supabase } from '@/lib/supabase';

export type Poll = {
  id: string;
  society_id: string;
  question: string;
  created_by_membership_id: string | null;
  closes_at: string | null;
  created_at: string;
};

export type PollOption = {
  id: string;
  poll_id: string;
  option_text: string;
};

export type PollOptionWithResults = PollOption & {
  vote_count: number;
};

export type PollWithResults = Poll & {
  options: PollOptionWithResults[];
  my_vote_option_id: string | null;
  total_votes: number;
  is_open: boolean;
};

const POLL_SELECT =
  'id, society_id, question, created_by_membership_id, closes_at, created_at';

const POLL_WITH_OPTIONS_SELECT = `
  ${POLL_SELECT},
  poll_options(id, poll_id, option_text)
`;

type RawPollOption = {
  id: string;
  poll_id: string;
  option_text: string;
};

type RawPollVote = {
  poll_id: string;
  option_id: string;
  membership_id: string;
};

function mapPoll(row: Record<string, unknown>): Poll {
  return {
    id: row.id as string,
    society_id: row.society_id as string,
    question: row.question as string,
    created_by_membership_id:
      (row.created_by_membership_id as string | null) ?? null,
    closes_at: (row.closes_at as string | null) ?? null,
    created_at: row.created_at as string,
  };
}

function mapPollWithResults(
  row: Record<string, unknown>,
  membershipId: string,
  votes: RawPollVote[],
  now = Date.now(),
): PollWithResults {
  const poll = mapPoll(row);
  const options =
    (row.poll_options as RawPollOption[] | null | undefined) ?? [];

  const voteCounts = new Map<string, number>();
  let myVoteOptionId: string | null = null;

  for (const vote of votes) {
    voteCounts.set(vote.option_id, (voteCounts.get(vote.option_id) ?? 0) + 1);
    if (vote.membership_id === membershipId) {
      myVoteOptionId = vote.option_id;
    }
  }

  const optionsWithResults: PollOptionWithResults[] = options.map((option) => ({
    id: option.id,
    poll_id: option.poll_id,
    option_text: option.option_text,
    vote_count: voteCounts.get(option.id) ?? 0,
  }));

  return {
    ...poll,
    options: optionsWithResults,
    my_vote_option_id: myVoteOptionId,
    total_votes: votes.length,
    is_open: isPollOpen(poll, now),
  };
}

async function loadVotesForPolls(
  pollIds: string[],
): Promise<Map<string, RawPollVote[]>> {
  const byPoll = new Map<string, RawPollVote[]>();
  if (pollIds.length === 0) return byPoll;

  const { data, error } = await supabase
    .from('poll_votes')
    .select('poll_id, option_id, membership_id')
    .in('poll_id', pollIds);

  if (error) throw error;

  for (const row of data ?? []) {
    const pollId = row.poll_id as string;
    const list = byPoll.get(pollId) ?? [];
    list.push({
      poll_id: pollId,
      option_id: row.option_id as string,
      membership_id: row.membership_id as string,
    });
    byPoll.set(pollId, list);
  }

  return byPoll;
}

async function fetchMyVoteOptionId(
  pollId: string,
  membershipId: string,
): Promise<string | null> {
  const { data, error } = await supabase
    .from('poll_votes')
    .select('option_id')
    .eq('poll_id', pollId)
    .eq('membership_id', membershipId)
    .maybeSingle();

  if (error) throw error;
  return (data?.option_id as string | undefined) ?? null;
}

export function getPollErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === 'object' && error && 'message' in error) {
    const message = (error as { message: unknown }).message;
    if (typeof message === 'string' && message.length > 0) return message;
  }
  return 'Could not record vote';
}

export function isPollOpen(
  poll: Pick<Poll, 'closes_at'>,
  now = Date.now(),
): boolean {
  if (!poll.closes_at) return true;
  return new Date(poll.closes_at).getTime() > now;
}

export function pollStatusBadge(
  poll: Pick<PollWithResults, 'is_open' | 'my_vote_option_id'>,
  showVoteStatus = false,
): {
  tone: 'pending' | 'success' | 'danger' | 'muted';
  label: string;
} {
  if (!poll.is_open) return { tone: 'muted', label: 'Closed' };
  if (showVoteStatus && poll.my_vote_option_id) {
    return { tone: 'success', label: 'Voted' };
  }
  return { tone: 'pending', label: 'Open' };
}

export async function listPollsForSociety(
  societyId: string,
  membershipId: string,
): Promise<PollWithResults[]> {
  const { data, error } = await supabase
    .from('polls')
    .select(POLL_WITH_OPTIONS_SELECT)
    .eq('society_id', societyId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  const rows = data ?? [];
  const votesByPoll = await loadVotesForPolls(rows.map((row) => row.id as string));

  return rows.map((row) =>
    mapPollWithResults(
      row as Record<string, unknown>,
      membershipId,
      votesByPoll.get(row.id as string) ?? [],
    ),
  );
}

export async function fetchPoll(
  id: string,
  membershipId: string,
): Promise<PollWithResults | null> {
  const { data, error } = await supabase
    .from('polls')
    .select(POLL_WITH_OPTIONS_SELECT)
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const votesByPoll = await loadVotesForPolls([id]);

  return mapPollWithResults(
    data as Record<string, unknown>,
    membershipId,
    votesByPoll.get(id) ?? [],
  );
}

export async function createPoll(input: {
  societyId: string;
  membershipId: string;
  question: string;
  options: string[];
  closesAt?: string | null;
}): Promise<PollWithResults> {
  const trimmedOptions = input.options
    .map((option) => option.trim())
    .filter(Boolean);

  if (trimmedOptions.length < 2) {
    throw new Error('A poll needs at least two options.');
  }

  const { data: pollRow, error: pollError } = await supabase
    .from('polls')
    .insert({
      society_id: input.societyId,
      created_by_membership_id: input.membershipId,
      question: input.question.trim(),
      closes_at: input.closesAt ?? null,
    })
    .select(POLL_SELECT)
    .single();

  if (pollError) throw pollError;

  const poll = mapPoll(pollRow as Record<string, unknown>);

  const { data: optionRows, error: optionsError } = await supabase
    .from('poll_options')
    .insert(
      trimmedOptions.map((option_text) => ({
        poll_id: poll.id,
        option_text,
      })),
    )
    .select('id, poll_id, option_text');

  if (optionsError) throw optionsError;

  const options: PollOptionWithResults[] = (optionRows ?? []).map((row) => ({
    id: row.id as string,
    poll_id: row.poll_id as string,
    option_text: row.option_text as string,
    vote_count: 0,
  }));

  return {
    ...poll,
    options,
    my_vote_option_id: null,
    total_votes: 0,
    is_open: isPollOpen(poll),
  };
}

async function insertVoteDirect(input: {
  pollId: string;
  optionId: string;
  membershipId: string;
}): Promise<{ option_id: string }> {
  const { error: insertError } = await supabase.from('poll_votes').insert({
    poll_id: input.pollId,
    option_id: input.optionId,
    membership_id: input.membershipId,
  });

  if (insertError) {
    if (insertError.code === '23505') {
      const existing = await fetchMyVoteOptionId(
        input.pollId,
        input.membershipId,
      );
      if (existing) return { option_id: existing };
    }
    throw insertError;
  }

  return { option_id: input.optionId };
}

export async function castVote(input: {
  pollId: string;
  optionId: string;
  membershipId?: string;
}): Promise<{ option_id: string }> {
  const { data, error } = await supabase.rpc('cast_poll_vote', {
    p_poll_id: input.pollId,
    p_option_id: input.optionId,
    p_membership_id: input.membershipId ?? null,
  });

  if (!error && data) {
    return { option_id: data as string };
  }

  if (!error && input.membershipId) {
    const existing = await fetchMyVoteOptionId(
      input.pollId,
      input.membershipId,
    );
    if (existing) return { option_id: existing };
  }

  if (error) {
    const rpcMissing =
      error.code === 'PGRST202' ||
      error.message?.includes('Could not find the function') ||
      error.message?.includes('cast_poll_vote');

    if (rpcMissing && input.membershipId) {
      return insertVoteDirect({
        pollId: input.pollId,
        optionId: input.optionId,
        membershipId: input.membershipId,
      });
    }

    if (input.membershipId) {
      const existing = await fetchMyVoteOptionId(
        input.pollId,
        input.membershipId,
      );
      if (existing) return { option_id: existing };
    }

    throw error;
  }

  throw new Error('Could not record vote');
}

export async function closePoll(input: { id: string }): Promise<Poll> {
  const { data, error } = await supabase
    .from('polls')
    .update({ closes_at: new Date().toISOString() })
    .eq('id', input.id)
    .select(POLL_SELECT)
    .single();

  if (error) throw error;
  return mapPoll(data as Record<string, unknown>);
}

export function countOpenPolls(polls: PollWithResults[]): number {
  return polls.filter((poll) => poll.is_open).length;
}

export function countOpenUnvotedPolls(polls: PollWithResults[]): number {
  return polls.filter((poll) => poll.is_open && !poll.my_vote_option_id).length;
}
