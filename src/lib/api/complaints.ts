import { supabase } from '@/lib/supabase';
import type { ComplaintStatus } from '@/types/database';

export type Complaint = {
  id: string;
  society_id: string;
  flat_id: string;
  raised_by_membership_id: string | null;
  category: string | null;
  description: string | null;
  photo_url: string | null;
  status: ComplaintStatus;
  created_at: string;
  resolved_at: string | null;
  flat_number?: string | null;
  block_name?: string | null;
};

const COMPLAINT_SELECT =
  'id, society_id, flat_id, raised_by_membership_id, category, description, photo_url, status, created_at, resolved_at, flats(flat_number, blocks(name))';

function mapComplaint(row: Record<string, unknown>): Complaint {
  const flats = row.flats as
    | { flat_number: string; blocks: { name: string } | null }
    | null
    | undefined;

  return {
    id: row.id as string,
    society_id: row.society_id as string,
    flat_id: row.flat_id as string,
    raised_by_membership_id:
      (row.raised_by_membership_id as string | null) ?? null,
    category: (row.category as string | null) ?? null,
    description: (row.description as string | null) ?? null,
    photo_url: (row.photo_url as string | null) ?? null,
    status: row.status as ComplaintStatus,
    created_at: row.created_at as string,
    resolved_at: (row.resolved_at as string | null) ?? null,
    flat_number: flats?.flat_number ?? null,
    block_name: flats?.blocks?.name ?? null,
  };
}

export async function listComplaintsBySociety(societyId: string) {
  const { data, error } = await supabase
    .from('complaints')
    .select(COMPLAINT_SELECT)
    .eq('society_id', societyId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []).map((row) =>
    mapComplaint(row as Record<string, unknown>),
  );
}

export async function listComplaintsByFlat(flatId: string) {
  const { data, error } = await supabase
    .from('complaints')
    .select(COMPLAINT_SELECT)
    .eq('flat_id', flatId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []).map((row) =>
    mapComplaint(row as Record<string, unknown>),
  );
}

export async function fetchComplaint(id: string) {
  const { data, error } = await supabase
    .from('complaints')
    .select(COMPLAINT_SELECT)
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  return mapComplaint(data as Record<string, unknown>);
}

export async function createComplaint(input: {
  societyId: string;
  flatId: string;
  membershipId: string;
  category: string;
  description: string;
  photoUrl?: string | null;
}) {
  const { data, error } = await supabase
    .from('complaints')
    .insert({
      society_id: input.societyId,
      flat_id: input.flatId,
      raised_by_membership_id: input.membershipId,
      category: input.category.trim(),
      description: input.description.trim(),
      photo_url: input.photoUrl ?? null,
      status: 'open',
    })
    .select(COMPLAINT_SELECT)
    .single();

  if (error) throw error;
  return mapComplaint(data as Record<string, unknown>);
}

export async function updateComplaintStatus(input: {
  id: string;
  status: ComplaintStatus;
}) {
  const patch: Record<string, unknown> = { status: input.status };
  if (input.status === 'resolved') {
    patch.resolved_at = new Date().toISOString();
  } else {
    patch.resolved_at = null;
  }

  const { data, error } = await supabase
    .from('complaints')
    .update(patch)
    .eq('id', input.id)
    .select(COMPLAINT_SELECT)
    .single();

  if (error) throw error;
  return mapComplaint(data as Record<string, unknown>);
}

export function complaintFlatLabel(complaint: Complaint): string {
  const flat = complaint.flat_number?.trim() || 'Flat';
  const block = complaint.block_name?.trim();
  return block ? `${block} · ${flat}` : flat;
}

export function complaintCategoryLabel(category: string | null | undefined): string {
  if (!category?.trim()) return 'Complaint';
  return category.charAt(0).toUpperCase() + category.slice(1);
}

export function complaintStatusBadge(status: ComplaintStatus): {
  tone: 'pending' | 'success' | 'danger' | 'muted';
  label: string;
} {
  if (status === 'open') return { tone: 'pending', label: 'Open' };
  if (status === 'in_progress') return { tone: 'pending', label: 'In progress' };
  return { tone: 'success', label: 'Resolved' };
}

export function countOpenComplaints(rows: Complaint[]): number {
  return rows.filter((c) => c.status === 'open' || c.status === 'in_progress')
    .length;
}
