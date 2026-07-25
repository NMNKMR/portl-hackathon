import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  createNotice,
  fetchNotice,
  listActiveNoticesWithReads,
  listNoticesForSociety,
  markNoticeRead,
} from '@/lib/api/notices';
import { queryKeys } from '@/lib/query-keys';

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
    mutationFn: markNoticeRead,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.notices.all });
    },
  });
}
