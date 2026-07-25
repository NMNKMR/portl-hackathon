import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';

import {
  createNotice,
  fetchNotice,
  listActiveNoticesWithReads,
  listNoticesForSociety,
  markNoticeRead,
  updateNotice,
  type Notice,
} from '@/lib/api/notices';
import { queryKeys } from '@/lib/query-keys';

function patchNoticeReadInCache(
  qc: QueryClient,
  input: {
    societyId: string;
    membershipId: string;
    noticeId: string;
    readAt: string;
  },
) {
  qc.setQueryData<Notice[]>(
    queryKeys.notices.activeForMember(input.societyId, input.membershipId),
    (old) =>
      old?.map((notice) =>
        notice.id === input.noticeId
          ? { ...notice, read_at: input.readAt }
          : notice,
      ) ?? old,
  );
}

export function useSocietyNotices(societyId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.notices.bySociety(societyId ?? ''),
    queryFn: () => listNoticesForSociety(societyId!),
    enabled: Boolean(societyId),
  });
}

export function useActiveNotices(input: {
  societyId: string | undefined;
  membershipId: string | undefined;
}) {
  return useQuery({
    queryKey: queryKeys.notices.activeForMember(
      input.societyId ?? '',
      input.membershipId ?? '',
    ),
    queryFn: () =>
      listActiveNoticesWithReads({
        societyId: input.societyId!,
        membershipId: input.membershipId!,
      }),
    enabled: Boolean(input.societyId && input.membershipId),
  });
}

export function useNotice(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.notices.detail(id ?? ''),
    queryFn: () => fetchNotice(id!),
    enabled: Boolean(id),
  });
}

export function useCreateNotice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createNotice,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.notices.all });
    },
  });
}

export function useMarkNoticeRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      noticeId: string;
      membershipId: string;
      societyId?: string;
    }) => markNoticeRead(input),
    onMutate: (variables) => {
      if (!variables.societyId) return;
      const readAt = new Date().toISOString();
      patchNoticeReadInCache(qc, {
        societyId: variables.societyId,
        membershipId: variables.membershipId,
        noticeId: variables.noticeId,
        readAt,
      });
      return { readAt };
    },
    onSuccess: (result, variables) => {
      if (variables.societyId) {
        patchNoticeReadInCache(qc, {
          societyId: variables.societyId,
          membershipId: variables.membershipId,
          noticeId: variables.noticeId,
          readAt: result.read_at,
        });
      }
    },
    onError: (_error, variables, context) => {
      if (!variables.societyId || !context?.readAt) return;
      qc.setQueryData<Notice[]>(
        queryKeys.notices.activeForMember(
          variables.societyId,
          variables.membershipId,
        ),
        (old) =>
          old?.map((notice) =>
            notice.id === variables.noticeId &&
            notice.read_at === context.readAt
              ? { ...notice, read_at: null }
              : notice,
          ) ?? old,
      );
    },
  });
}

export function useUpdateNotice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: updateNotice,
    onSuccess: (data) => {
      void qc.invalidateQueries({ queryKey: queryKeys.notices.all });
      void qc.invalidateQueries({
        queryKey: queryKeys.notices.detail(data.id),
      });
    },
  });
}
