import { supabase } from '@/lib/supabase';

export type StaffCategory = {
  id: string;
  name: string;
  icon: string | null;
  is_system_default: boolean;
  society_id: string | null;
};

export type StaffMember = {
  id: string;
  society_id: string;
  flat_id: string | null;
  name: string;
  category_id: string | null;
  phone: string | null;
  photo_url: string | null;
  is_recurring: boolean;
  pass_token: string;
  created_by_membership_id: string | null;
  created_at: string;
  category_name?: string | null;
  flat_number?: string | null;
  block_name?: string | null;
};

const STAFF_SELECT =
  'id, society_id, flat_id, name, category_id, phone, photo_url, is_recurring, pass_token, created_by_membership_id, created_at, staff_categories(name), flats(flat_number, blocks(name))';

const DEFAULT_CATEGORY_NAMES = [
  'Maid',
  'Gardener',
  'Milkman',
  'Driver',
  'Cook',
  'Other',
] as const;

function mapStaffRow(row: Record<string, unknown>): StaffMember {
  const category = row.staff_categories as { name: string } | null | undefined;
  const flats = row.flats as
    | { flat_number: string; blocks: { name: string } | null }
    | null
    | undefined;

  return {
    id: row.id as string,
    society_id: row.society_id as string,
    flat_id: (row.flat_id as string | null) ?? null,
    name: row.name as string,
    category_id: (row.category_id as string | null) ?? null,
    phone: (row.phone as string | null) ?? null,
    photo_url: (row.photo_url as string | null) ?? null,
    is_recurring: Boolean(row.is_recurring),
    pass_token: row.pass_token as string,
    created_by_membership_id:
      (row.created_by_membership_id as string | null) ?? null,
    created_at: row.created_at as string,
    category_name: category?.name ?? null,
    flat_number: flats?.flat_number ?? null,
    block_name: flats?.blocks?.name ?? null,
  };
}

export async function listStaffCategories(societyId: string) {
  const { data, error } = await supabase
    .from('staff_categories')
    .select('id, name, icon, is_system_default, society_id')
    .or(`society_id.eq.${societyId},society_id.is.null`)
    .order('name');

  if (error) throw error;
  return (data ?? []) as StaffCategory[];
}

/** Seed society categories once if none exist (admin-only insert via RLS). */
export async function ensureStaffCategories(societyId: string) {
  const existing = await listStaffCategories(societyId);
  if (existing.length > 0) return existing;

  const { error } = await supabase.from('staff_categories').insert(
    DEFAULT_CATEGORY_NAMES.map((name) => ({
      name,
      society_id: societyId,
      is_system_default: true,
    })),
  );
  if (error) throw error;
  return listStaffCategories(societyId);
}

export async function listStaffDirectory(input: {
  societyId: string;
  /** When set, list only staff linked to this flat (resident). */
  flatId?: string | null;
  /** When true, list only society-wide staff (flat_id is null). Admin directory. */
  societyLevelOnly?: boolean;
}) {
  let query = supabase
    .from('staff_directory')
    .select(STAFF_SELECT)
    .eq('society_id', input.societyId)
    .order('name');

  if (input.societyLevelOnly) {
    query = query.is('flat_id', null);
  } else if (input.flatId) {
    query = query.eq('flat_id', input.flatId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map((row) => mapStaffRow(row as Record<string, unknown>));
}

export async function fetchStaffById(id: string) {
  const { data, error } = await supabase
    .from('staff_directory')
    .select(STAFF_SELECT)
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  return mapStaffRow(data as Record<string, unknown>);
}

export async function fetchStaffByPassToken(passToken: string) {
  const { data, error } = await supabase
    .from('staff_directory')
    .select(STAFF_SELECT)
    .eq('pass_token', passToken)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  return mapStaffRow(data as Record<string, unknown>);
}

export async function createStaffMember(input: {
  societyId: string;
  flatId?: string | null;
  name: string;
  categoryId?: string | null;
  phone?: string | null;
  photoUrl?: string | null;
  isRecurring?: boolean;
  membershipId?: string | null;
}) {
  const { data, error } = await supabase
    .from('staff_directory')
    .insert({
      society_id: input.societyId,
      flat_id: input.flatId ?? null,
      name: input.name.trim(),
      category_id: input.categoryId ?? null,
      phone: input.phone?.trim() || null,
      photo_url: input.photoUrl ?? null,
      is_recurring: input.isRecurring ?? true,
      created_by_membership_id: input.membershipId ?? null,
    })
    .select(STAFF_SELECT)
    .single();

  if (error) throw error;
  return mapStaffRow(data as Record<string, unknown>);
}

export function staffFlatLabel(staff: StaffMember): string {
  if (!staff.flat_number) return 'Society-wide';
  const block = staff.block_name?.trim();
  return block ? `${block} · ${staff.flat_number}` : staff.flat_number;
}
