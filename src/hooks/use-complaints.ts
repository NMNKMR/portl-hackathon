import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  createComplaint,
  fetchComplaint,
  listComplaintsByFlat,
  listComplaintsBySociety,
  updateComplaint,
  updateComplaintStatus,
} from '@/lib/api/complaints';
import { queryKeys } from '@/lib/query-keys';
import type { ComplaintStatus } from '@/types/database';

export function useSocietyComplaints(societyId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.complaints.bySociety(societyId ?? ''),
    queryFn: () => listComplaintsBySociety(societyId!),
    enabled: Boolean(societyId),
  });
}

export function useFlatComplaints(flatId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.complaints.byFlat(flatId ?? ''),
    queryFn: () => listComplaintsByFlat(flatId!),
    enabled: Boolean(flatId),
  });
}

export function useComplaint(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.complaints.detail(id ?? ''),
    queryFn: () => fetchComplaint(id!),
    enabled: Boolean(id),
  });
}

export function useCreateComplaint() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createComplaint,
    onSuccess: (data) => {
      void qc.invalidateQueries({ queryKey: queryKeys.complaints.all });
      void qc.invalidateQueries({
        queryKey: queryKeys.complaints.detail(data.id),
      });
    },
  });
}

export function useUpdateComplaintStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: string; status: ComplaintStatus }) =>
      updateComplaintStatus(input),
    onSuccess: (data) => {
      void qc.invalidateQueries({ queryKey: queryKeys.complaints.all });
      void qc.invalidateQueries({
        queryKey: queryKeys.complaints.detail(data.id),
      });
    },
  });
}

export function useUpdateComplaint() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: updateComplaint,
    onSuccess: (data) => {
      void qc.invalidateQueries({ queryKey: queryKeys.complaints.all });
      void qc.invalidateQueries({
        queryKey: queryKeys.complaints.detail(data.id),
      });
    },
  });
}
