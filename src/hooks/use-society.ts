import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  createFlat,
  createSociety,
  fetchMyMemberships,
  fetchPendingMemberships,
  fetchSociety,
  fetchSocietyFlats,
  lookupSocietyByCode,
  requestMembership,
  updateMembershipStatus,
} from '@/lib/api/society';
import { queryKeys } from '@/lib/query-keys';
import type { SocietyPlan } from '@/types/database';

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

export function useSocietyFlats(societyId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.flats.bySociety(societyId ?? ''),
    queryFn: () => fetchSocietyFlats(societyId!),
    enabled: Boolean(societyId),
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

export function useCreateFlat() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { societyId: string; flatNumber: string }) =>
      createFlat(input.societyId, input.flatNumber),
    onSuccess: async (_data, vars) => {
      await qc.invalidateQueries({
        queryKey: queryKeys.flats.bySociety(vars.societyId),
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
      await qc.invalidateQueries({ queryKey: queryKeys.memberships.mine() });
    },
  });
}
