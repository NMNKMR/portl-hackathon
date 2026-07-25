import {
  guestQrExpiresAt,
  isGuestQrExpired,
  remainingScans,
} from '@/lib/visitor-qr';
import { supabase } from '@/lib/supabase';
import type {
  VehicleType,
  VisitorInitiator,
  VisitorStatus,
  VisitorType,
} from '@/types/database';

function newToken(): string {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export type VisitorRequest = {
  id: string;
  society_id: string;
  flat_id: string;
  guard_membership_id: string | null;
  initiated_by: VisitorInitiator;
  visitor_name: string;
  visitor_phone: string | null;
  visitor_type: VisitorType;
  photo_url: string | null;
  vehicle_number: string | null;
  vehicle_type: VehicleType | null;
  status: VisitorStatus;
  qr_token: string | null;
  qr_expires_at: string | null;
  max_scans: number;
  scan_count: number;
  requested_at: string;
  approved_by_membership_id: string | null;
  approved_at: string | null;
  checked_in_at: string | null;
  checked_out_at: string | null;
  flat_number?: string | null;
  block_name?: string | null;
};

const VISITOR_SELECT =
  'id, society_id, flat_id, guard_membership_id, initiated_by, visitor_name, visitor_phone, visitor_type, photo_url, vehicle_number, vehicle_type, status, qr_token, qr_expires_at, max_scans, scan_count, requested_at, approved_by_membership_id, approved_at, checked_in_at, checked_out_at, flats(flat_number, blocks(name))';

function mapVisitorRow(row: Record<string, unknown>): VisitorRequest {
  const flats = row.flats as
    | { flat_number: string; blocks: { name: string } | null }
    | null
    | undefined;

  return {
    id: row.id as string,
    society_id: row.society_id as string,
    flat_id: row.flat_id as string,
    guard_membership_id: (row.guard_membership_id as string | null) ?? null,
    initiated_by: row.initiated_by as VisitorInitiator,
    visitor_name: row.visitor_name as string,
    visitor_phone: (row.visitor_phone as string | null) ?? null,
    visitor_type: row.visitor_type as VisitorType,
    photo_url: (row.photo_url as string | null) ?? null,
    vehicle_number: (row.vehicle_number as string | null) ?? null,
    vehicle_type: (row.vehicle_type as VehicleType | null) ?? null,
    status: row.status as VisitorStatus,
    qr_token: (row.qr_token as string | null) ?? null,
    qr_expires_at: (row.qr_expires_at as string | null) ?? null,
    max_scans: Number(row.max_scans ?? 1),
    scan_count: Number(row.scan_count ?? 0),
    requested_at: row.requested_at as string,
    approved_by_membership_id:
      (row.approved_by_membership_id as string | null) ?? null,
    approved_at: (row.approved_at as string | null) ?? null,
    checked_in_at: (row.checked_in_at as string | null) ?? null,
    checked_out_at: (row.checked_out_at as string | null) ?? null,
    flat_number: flats?.flat_number ?? null,
    block_name: flats?.blocks?.name ?? null,
  };
}

export type CreateVisitorInput = {
  societyId: string;
  flatId: string;
  guardMembershipId: string | null;
  initiatedBy: VisitorInitiator;
  visitorName: string;
  visitorPhone?: string | null;
  visitorType: VisitorType;
  photoUrl?: string | null;
  vehicleNumber?: string | null;
  vehicleType?: VehicleType | null;
};

export async function createVisitorRequest(input: CreateVisitorInput) {
  const { data, error } = await supabase
    .from('visitor_requests')
    .insert({
      society_id: input.societyId,
      flat_id: input.flatId,
      guard_membership_id: input.guardMembershipId,
      initiated_by: input.initiatedBy,
      visitor_name: input.visitorName.trim(),
      visitor_phone: input.visitorPhone?.trim() || null,
      visitor_type: input.visitorType,
      photo_url: input.photoUrl ?? null,
      vehicle_number: input.vehicleNumber?.trim() || null,
      vehicle_type: input.vehicleType ?? null,
      status: 'pending',
      max_scans: 1,
      scan_count: 0,
    })
    .select(VISITOR_SELECT)
    .single();

  if (error) throw error;
  return mapVisitorRow(data as Record<string, unknown>);
}

export type CreatePreApprovalInput = {
  societyId: string;
  flatId: string;
  membershipId: string;
  visitorName: string;
  visitorPhone?: string | null;
  visitorType: VisitorType;
  photoUrl?: string | null;
  vehicleNumber?: string | null;
  vehicleType?: VehicleType | null;
  maxScans?: number;
  withQr?: boolean;
};

export async function createGuestPreApproval(input: CreatePreApprovalInput) {
  const maxScans = Math.max(1, Math.min(99, Math.floor(input.maxScans ?? 1)));
  const now = new Date().toISOString();
  const withQr = Boolean(input.withQr);
  const qrToken = withQr ? newToken() : null;

  const { data, error } = await supabase
    .from('visitor_requests')
    .insert({
      society_id: input.societyId,
      flat_id: input.flatId,
      guard_membership_id: null,
      initiated_by: 'resident',
      visitor_name: input.visitorName.trim(),
      visitor_phone: input.visitorPhone?.trim() || null,
      visitor_type: input.visitorType,
      photo_url: input.photoUrl ?? null,
      vehicle_number: input.vehicleNumber?.trim() || null,
      vehicle_type: input.vehicleType ?? null,
      status: 'approved',
      approved_by_membership_id: input.membershipId,
      approved_at: now,
      qr_token: qrToken,
      qr_expires_at: withQr ? guestQrExpiresAt(24) : null,
      max_scans: maxScans,
      scan_count: 0,
    })
    .select(VISITOR_SELECT)
    .single();

  if (error) throw error;
  return mapVisitorRow(data as Record<string, unknown>);
}

export async function attachQrToPreApproval(id: string) {
  const existing = await fetchVisitorRequest(id);
  if (!existing) throw new Error('Pre-approval not found');
  if (existing.initiated_by !== 'resident') {
    throw new Error('Only resident pre-approvals can get a QR');
  }
  if (existing.qr_token) return existing;
  if (remainingScans(existing) <= 0) {
    throw new Error('This pass has no entries left');
  }

  const { data, error } = await supabase
    .from('visitor_requests')
    .update({
      qr_token: newToken(),
      qr_expires_at: guestQrExpiresAt(24),
    })
    .eq('id', id)
    .select(VISITOR_SELECT)
    .single();

  if (error) throw error;
  return mapVisitorRow(data as Record<string, unknown>);
}

export async function fetchVisitorByQrToken(qrToken: string) {
  const { data, error } = await supabase
    .from('visitor_requests')
    .select(VISITOR_SELECT)
    .eq('qr_token', qrToken)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  return mapVisitorRow(data as Record<string, unknown>);
}

export async function fetchVisitorRequestsBySociety(societyId: string) {
  const { data, error } = await supabase
    .from('visitor_requests')
    .select(VISITOR_SELECT)
    .eq('society_id', societyId)
    .order('requested_at', { ascending: false });

  if (error) throw error;
  return (data ?? []).map((row) =>
    mapVisitorRow(row as Record<string, unknown>),
  );
}

export async function fetchVisitorRequestsByFlat(flatId: string) {
  const { data, error } = await supabase
    .from('visitor_requests')
    .select(VISITOR_SELECT)
    .eq('flat_id', flatId)
    .order('requested_at', { ascending: false });

  if (error) throw error;
  return (data ?? []).map((row) =>
    mapVisitorRow(row as Record<string, unknown>),
  );
}

export async function fetchVisitorRequest(id: string) {
  const { data, error } = await supabase
    .from('visitor_requests')
    .select(VISITOR_SELECT)
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  return mapVisitorRow(data as Record<string, unknown>);
}

export async function respondToVisitorRequest(input: {
  id: string;
  status: 'approved' | 'rejected';
  membershipId: string;
}) {
  const { data, error } = await supabase
    .from('visitor_requests')
    .update({
      status: input.status,
      approved_by_membership_id: input.membershipId,
      approved_at: new Date().toISOString(),
    })
    .eq('id', input.id)
    .eq('status', 'pending')
    .select(VISITOR_SELECT)
    .single();

  if (error) throw error;
  return mapVisitorRow(data as Record<string, unknown>);
}

/** Classic single check-in for guard-initiated / pending→approved flow. */
export async function checkInVisitor(id: string) {
  return admitVisitorEntry(id, { requireNoQr: false });
}

/**
 * Admit one entry against an approved pass (list or QR).
 * Enforces max_scans, optional QR-only / no-QR rules, and expiry.
 */
export async function admitVisitorEntry(
  id: string,
  opts?: { requireQr?: boolean; requireNoQr?: boolean },
) {
  const current = await fetchVisitorRequest(id);
  if (!current) throw new Error('Visitor not found');
  if (current.status !== 'approved') {
    throw new Error('Only approved passes can be admitted');
  }
  if (remainingScans(current) <= 0) {
    throw new Error('No entries left on this pass');
  }
  if (opts?.requireQr && !current.qr_token) {
    throw new Error('This pass has no QR — admit from the list instead');
  }
  if (opts?.requireNoQr && current.qr_token) {
    throw new Error('QR available — scan the QR to grant entry');
  }
  if (current.qr_token && isGuestQrExpired(current.qr_expires_at)) {
    throw new Error('This QR has expired');
  }

  const now = new Date().toISOString();
  const nextCount = current.scan_count + 1;
  const exhausted = nextCount >= current.max_scans;
  const single = current.max_scans === 1;

  const patch: Record<string, unknown> = {
    scan_count: nextCount,
    checked_in_at: current.checked_in_at ?? now,
  };

  if (exhausted && single) {
    patch.status = 'checked_in';
  } else if (exhausted && !single) {
    patch.status = 'checked_out';
    patch.checked_out_at = now;
  }

  const { data, error } = await supabase
    .from('visitor_requests')
    .update(patch)
    .eq('id', id)
    .eq('status', 'approved')
    .eq('scan_count', current.scan_count)
    .select(VISITOR_SELECT)
    .single();

  if (error) throw error;
  return mapVisitorRow(data as Record<string, unknown>);
}

export async function checkOutVisitor(id: string) {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('visitor_requests')
    .update({
      status: 'checked_out',
      checked_out_at: now,
    })
    .eq('id', id)
    .eq('status', 'checked_in')
    .select(VISITOR_SELECT)
    .single();

  if (error) throw error;
  return mapVisitorRow(data as Record<string, unknown>);
}

export function visitorFlatLabel(visitor: VisitorRequest): string {
  const flat = visitor.flat_number?.trim() || 'Flat';
  const block = visitor.block_name?.trim();
  return block ? `${block} · ${flat}` : flat;
}

export function hasQrPass(visitor: VisitorRequest): boolean {
  return Boolean(visitor.qr_token);
}
