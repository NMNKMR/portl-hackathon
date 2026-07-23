import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  batchUpdateMembershipStatus,
  createBlock,
  createFlat,
  createFlatsInRange,
  createSociety,
  fetchFlatJoinInfo,
  fetchMyMemberships,
  fetchPendingHousehold,
  fetchPendingMemberships,
  fetchSociety,
  fetchSocietyBlocks,
  fetchSocietyFlats,
  lookupSocietyByCode,
  requestMembership,
  updateBlock,
  updateMembershipStatus,
} from '@/lib/api/society';
import { queryKeys } from '@/lib/query-keys';
import type { BlockType, SocietyPlan } from '@/types/database';

export function useMyMemberships() {
  return useQuery({
    queryKey: queryKeys.memberships.mine(),
    queryFn: fetchMyMemberships,
  });
}

export function useSociety(societyId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.societies.detail(societyId ?? ''),
    queryFn: () => fetchSociety(societyId!),
    enabled: Boolean(societyId),
  });
}

export function useSocietyBlocks(societyId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.blocks.bySociety(societyId ?? ''),
    queryFn: () => fetchSocietyBlocks(societyId!),
    enabled: Boolean(societyId),
  });
}

export function useSocietyFlats(societyId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.flats.bySociety(societyId ?? ''),
    queryFn: () => fetchSocietyFlats(societyId!),
    enabled: Boolean(societyId),
  });
}

export function useFlatJoinInfo(flatId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.flats.joinInfo(flatId ?? ''),
    queryFn: () => fetchFlatJoinInfo(flatId!),
    enabled: Boolean(flatId),
  });
}

export function usePendingHousehold(flatId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.memberships.pendingHousehold(flatId ?? ''),
    queryFn: () => fetchPendingHousehold(flatId!),
    enabled: Boolean(flatId),
  });
}

export function usePendingMemberships(societyId: string | undefined) {
  return useQuery({
    queryKey: [...queryKeys.memberships.all, 'pending', societyId] as const,
    queryFn: () => fetchPendingMemberships(societyId!),
    enabled: Boolean(societyId),
  });
}

export function useCreateSociety() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { name: string; plan?: SocietyPlan }) =>
      createSociety(input.name, input.plan ?? 'free'),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: queryKeys.memberships.mine() });
    },
  });
}

export function useLookupSociety() {
  return useMutation({
    mutationFn: (code: string) => lookupSocietyByCode(code),
  });
}

export function useRequestMembership() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: requestMembership,
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: queryKeys.memberships.mine() });
    },
  });
}

export function useCreateBlock() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      societyId: string;
      name: string;
      type?: BlockType;
    }) => createBlock(input.societyId, input.name, input.type ?? 'block'),
    onSuccess: async (_data, vars) => {
      await qc.invalidateQueries({
        queryKey: queryKeys.blocks.bySociety(vars.societyId),
      });
    },
  });
}

export function useCreateFlat() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      societyId: string;
      flatNumber: string;
      blockId?: string | null;
    }) => createFlat(input.societyId, input.flatNumber, input.blockId),
    onSuccess: async (_data, vars) => {
      await qc.invalidateQueries({
        queryKey: queryKeys.flats.bySociety(vars.societyId),
      });
    },
  });
}

export function useCreateFlatsInRange() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      societyId: string;
      start: string;
      end: string;
      blockId?: string | null;
    }) =>
      createFlatsInRange(
        input.societyId,
        input.start,
        input.end,
        input.blockId,
      ),
    onSuccess: async (_data, vars) => {
      await qc.invalidateQueries({
        queryKey: queryKeys.flats.bySociety(vars.societyId),
      });
    },
  });
}

export function useUpdateBlock() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      blockId: string;
      societyId: string;
      name?: string;
      type?: BlockType;
    }) => updateBlock(input.blockId, { name: input.name, type: input.type }),
    onSuccess: async (_data, vars) => {
      await qc.invalidateQueries({
        queryKey: queryKeys.blocks.bySociety(vars.societyId),
      });
    },
  });
}

export function useUpdateMembershipStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      membershipId: string;
      status: 'approved' | 'rejected';
      societyId: string;
    }) => updateMembershipStatus(input.membershipId, input.status),
    onSuccess: async (_data, vars) => {
      await qc.invalidateQueries({
        queryKey: [...queryKeys.memberships.all, 'pending', vars.societyId],
      });
      await qc.invalidateQueries({
        queryKey: queryKeys.memberships.all,
      });
      await qc.invalidateQueries({ queryKey: queryKeys.memberships.mine() });
    },
  });
}

export function useBatchUpdateMembershipStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      membershipIds: string[];
      status: 'approved' | 'rejected';
      societyId: string;
    }) =>
      batchUpdateMembershipStatus(input.membershipIds, input.status),
    onSuccess: async (_data, vars) => {
      await qc.invalidateQueries({
        queryKey: [...queryKeys.memberships.all, 'pending', vars.societyId],
      });
      await qc.invalidateQueries({
        queryKey: queryKeys.memberships.all,
      });
      await qc.invalidateQueries({ queryKey: queryKeys.memberships.mine() });
    },
  });
}
