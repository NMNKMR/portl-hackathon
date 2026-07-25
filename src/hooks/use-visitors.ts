import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import {
  admitVisitorEntry,
  attachQrToPreApproval,
  checkInVisitor,
  checkOutVisitor,
  createGuestPreApproval,
  createVisitorRequest,
  fetchVisitorByQrToken,
  fetchVisitorRequest,
  fetchVisitorRequestsByFlat,
  fetchVisitorRequestsBySociety,
  respondToVisitorRequest,
  type CreatePreApprovalInput,
  type CreateVisitorInput,
} from '@/lib/api/visitors';
import { queryKeys } from '@/lib/query-keys';
import { supabase } from '@/lib/supabase';

export function useSocietyVisitors(societyId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.visitorRequests.bySociety(societyId ?? ''),
    queryFn: () => fetchVisitorRequestsBySociety(societyId!),
    enabled: Boolean(societyId),
  });
}

export function useFlatVisitors(flatId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.visitorRequests.byFlat(flatId ?? ''),
    queryFn: () => fetchVisitorRequestsByFlat(flatId!),
    enabled: Boolean(flatId),
  });
}

export function useVisitorRequest(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.visitorRequests.detail(id ?? ''),
    queryFn: () => fetchVisitorRequest(id!),
    enabled: Boolean(id),
  });
}

function invalidateVisitorCaches(
  qc: ReturnType<typeof useQueryClient>,
  vars: { societyId?: string; flatId?: string; id?: string },
) {
  if (vars.societyId) {
    void qc.invalidateQueries({
      queryKey: queryKeys.visitorRequests.bySociety(vars.societyId),
    });
  }
  if (vars.flatId) {
    void qc.invalidateQueries({
      queryKey: queryKeys.visitorRequests.byFlat(vars.flatId),
    });
  }
  if (vars.id) {
    void qc.invalidateQueries({
      queryKey: queryKeys.visitorRequests.detail(vars.id),
    });
  }
  void qc.invalidateQueries({ queryKey: queryKeys.visitorRequests.all });
}

export function useCreateVisitorRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateVisitorInput) => createVisitorRequest(input),
    onSuccess: (data) => {
      invalidateVisitorCaches(qc, {
        societyId: data.society_id,
        flatId: data.flat_id,
        id: data.id,
      });
    },
  });
}

export function useRespondToVisitor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: respondToVisitorRequest,
    onSuccess: (data) => {
      invalidateVisitorCaches(qc, {
        societyId: data.society_id,
        flatId: data.flat_id,
        id: data.id,
      });
    },
  });
}

export function useCheckInVisitor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: checkInVisitor,
    onSuccess: (data) => {
      invalidateVisitorCaches(qc, {
        societyId: data.society_id,
        flatId: data.flat_id,
        id: data.id,
      });
    },
  });
}

export function useAdmitVisitorEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      id: string;
      requireQr?: boolean;
      requireNoQr?: boolean;
    }) =>
      admitVisitorEntry(input.id, {
        requireQr: input.requireQr,
        requireNoQr: input.requireNoQr,
      }),
    onSuccess: (data) => {
      invalidateVisitorCaches(qc, {
        societyId: data.society_id,
        flatId: data.flat_id,
        id: data.id,
      });
    },
  });
}

export function useCreateGuestPreApproval() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreatePreApprovalInput) => createGuestPreApproval(input),
    onSuccess: (data) => {
      invalidateVisitorCaches(qc, {
        societyId: data.society_id,
        flatId: data.flat_id,
        id: data.id,
      });
    },
  });
}

export function useAttachQrToPreApproval() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: attachQrToPreApproval,
    onSuccess: (data) => {
      invalidateVisitorCaches(qc, {
        societyId: data.society_id,
        flatId: data.flat_id,
        id: data.id,
      });
    },
  });
}

export function useVisitorByQrToken(token: string | undefined) {
  return useQuery({
    queryKey: [...queryKeys.visitorRequests.all, 'qr', token ?? ''] as const,
    queryFn: () => fetchVisitorByQrToken(token!),
    enabled: Boolean(token),
  });
}

export function useCheckOutVisitor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: checkOutVisitor,
    onSuccess: (data) => {
      invalidateVisitorCaches(qc, {
        societyId: data.society_id,
        flatId: data.flat_id,
        id: data.id,
      });
    },
  });
}

/** Subscribe to visitor_requests for a flat/society; invalidate Query cache on changes. */
export function useVisitorRealtime(input: {
  flatId?: string;
  societyId?: string;
  enabled?: boolean;
}) {
  const qc = useQueryClient();
  const enabled = input.enabled ?? true;
  const flatId = input.flatId;
  const societyId = input.societyId;

  useEffect(() => {
    if (!enabled) return;
    if (!flatId && !societyId) return;

    // Unique topic per mount — reusing `visitors:<id>` returns an already-joined
    // channel, and supabase-js throws if you add postgres_changes after subscribe().
    const scope = flatId ?? societyId;
    const channel = supabase.channel(`visitors:${scope}:${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);

    const filter = flatId
      ? `flat_id=eq.${flatId}`
      : `society_id=eq.${societyId}`;

    channel
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'visitor_requests',
          filter,
        },
        (payload) => {
          const row = (payload.new ?? payload.old) as {
            id?: string;
            flat_id?: string;
            society_id?: string;
          } | null;
          invalidateVisitorCaches(qc, {
            id: row?.id,
            flatId: row?.flat_id ?? flatId,
            societyId: row?.society_id ?? societyId,
          });
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [enabled, flatId, societyId, qc]);
}
