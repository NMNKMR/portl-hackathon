import { supabase } from '@/lib/supabase';

export type Notice = {
  id: string;
  society_id: string;
  title: string;
  body: string | null;
  photo_url: string | null;
  posted_by_membership_id: string | null;
  pinned: boolean;
  valid_from: string;
  valid_till: string | null;
  is_active: boolean;
  created_at: string;
  read_at?: string | null;
};

const NOTICE_SELECT =
  'id, society_id, title, body, photo_url, posted_by_membership_id, pinned, valid_from, valid_till, is_active, created_at';

function mapNotice(
  row: Record<string, unknown>,
  readAt?: string | null,
): Notice {
  return {
    id: row.id as string,
    society_id: row.society_id as string,
    title: row.title as string,
    body: (row.body as string | null) ?? null,
    photo_url: (row.photo_url as string | null) ?? null,
    posted_by_membership_id:
      (row.posted_by_membership_id as string | null) ?? null,
    pinned: Boolean(row.pinned),
    valid_from: row.valid_from as string,
    valid_till: (row.valid_till as string | null) ?? null,
    is_active: Boolean(row.is_active),
    created_at: row.created_at as string,
    read_at: readAt ?? null,
  };
}

function isCurrentlyActive(notice: Notice, now = Date.now()): boolean {
  if (!notice.is_active) return false;
  if (new Date(notice.valid_from).getTime() > now) return false;
  if (notice.valid_till && new Date(notice.valid_till).getTime() < now) {
    return false;
  }
  return true;
}

export async function listNoticesForSociety(societyId: string) {
  const { data, error } = await supabase
    .from('notices')
    .select(NOTICE_SELECT)
    .eq('society_id', societyId)
    .order('pinned', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []).map((row) => mapNotice(row as Record<string, unknown>));
}

export async function listActiveNoticesWithReads(input: {
  societyId: string;
  membershipId: string;
}) {
  const notices = await listNoticesForSociety(input.societyId);
  const active = notices.filter((n) => isCurrentlyActive(n));

  const { data: reads, error } = await supabase
    .from('notice_reads')
    .select('notice_id, read_at')
    .eq('membership_id', input.membershipId);

  if (error) throw error;

  const readMap = new Map(
    (reads ?? []).map((r) => [r.notice_id as string, r.read_at as string]),
  );

  return active.map((n) => ({
    ...n,
    read_at: readMap.get(n.id) ?? null,
  }));
}

export async function fetchNotice(id: string) {
  const { data, error } = await supabase
    .from('notices')
    .select(NOTICE_SELECT)
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  return mapNotice(data as Record<string, unknown>);
}

export async function createNotice(input: {
  societyId: string;
  membershipId: string;
  title: string;
  body?: string | null;
  photoUrl?: string | null;
  pinned?: boolean;
  validFrom?: string;
  validTill?: string | null;
}) {
  const { data, error } = await supabase
    .from('notices')
    .insert({
      society_id: input.societyId,
      posted_by_membership_id: input.membershipId,
      title: input.title.trim(),
      body: input.body?.trim() || null,
      photo_url: input.photoUrl ?? null,
      pinned: input.pinned ?? false,
      valid_from: input.validFrom ?? new Date().toISOString(),
      valid_till: input.validTill ?? null,
      is_active: true,
    })
    .select(NOTICE_SELECT)
    .single();

  if (error) throw error;
  return mapNotice(data as Record<string, unknown>);
}

export async function markNoticeRead(input: {
  noticeId: string;
  membershipId: string;
}) {
  const { data: existing, error: readError } = await supabase
    .from('notice_reads')
    .select('id')
    .eq('notice_id', input.noticeId)
    .eq('membership_id', input.membershipId)
    .maybeSingle();

  if (readError) throw readError;
  if (existing) return;

  const { error } = await supabase.from('notice_reads').insert({
    notice_id: input.noticeId,
    membership_id: input.membershipId,
    read_at: new Date().toISOString(),
  });

  if (error) throw error;
}

export function countUnreadNotices(notices: Notice[]): number {
  return notices.filter((n) => !n.read_at).length;
}
