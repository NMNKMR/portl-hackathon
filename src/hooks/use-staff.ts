import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  createStaffMember,
  ensureStaffCategories,
  fetchStaffById,
  fetchStaffByPassToken,
  listStaffCategories,
  listStaffDirectory,
} from '@/lib/api/staff';
import { queryKeys } from '@/lib/query-keys';

export function useStaffCategories(
  societyId: string | undefined,
  options?: { seedIfMissing?: boolean },
) {
  const seedIfMissing = options?.seedIfMissing ?? false;
  return useQuery({
    queryKey: queryKeys.staff.categories(societyId ?? '', seedIfMissing),
    queryFn: () =>
      seedIfMissing
        ? ensureStaffCategories(societyId!)
        : listStaffCategories(societyId!),
    enabled: Boolean(societyId),
  });
}

export function useStaffDirectory(input: {
  societyId: string | undefined;
  flatId?: string | null;
  societyLevelOnly?: boolean;
}) {
  return useQuery({
    queryKey: queryKeys.staff.bySociety(
      input.societyId ?? '',
      input.flatId ?? null,
      input.societyLevelOnly ?? false,
    ),
    queryFn: () =>
      listStaffDirectory({
        societyId: input.societyId!,
        flatId: input.flatId,
        societyLevelOnly: input.societyLevelOnly,
      }),
    enabled: Boolean(input.societyId),
  });
}

export function useStaffMember(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.staff.detail(id ?? ''),
    queryFn: () => fetchStaffById(id!),
    enabled: Boolean(id),
  });
}

export function useStaffByPassToken(token: string | undefined) {
  return useQuery({
    queryKey: queryKeys.staff.byPass(token ?? ''),
    queryFn: () => fetchStaffByPassToken(token!),
    enabled: Boolean(token),
  });
}

export function useCreateStaffMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createStaffMember,
    onSuccess: (data) => {
      void qc.invalidateQueries({ queryKey: queryKeys.staff.all });
      void qc.invalidateQueries({
        queryKey: queryKeys.staff.detail(data.id),
      });
    },
  });
}
