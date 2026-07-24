import { parseNumericFlatRange } from '@/lib/flat-range';
import { supabase } from '@/lib/supabase';
import type {
  BlockType,
  MembershipRole,
  MembershipStatus,
  ResidentMemberType,
  ResidentType,
  SocietyPlan,
} from '@/types/database';

export type Society = {
  id: string;
  name: string;
  code: string;
  plan: SocietyPlan;
  flat_limit: number | null;
  created_at: string;
};

export type Block = {
  id: string;
  society_id: string;
  type: BlockType;
  name: string;
  created_at: string;
};

export type Flat = {
  id: string;
  society_id: string;
  block_id: string | null;
  flat_number: string;
  created_at: string;
  block_name?: string | null;
};

export type Membership = {
  id: string;
  user_id: string;
  society_id: string;
  flat_id: string | null;
  role: MembershipRole;
  resident_type: ResidentType | null;
  member_type: ResidentMemberType | null;
  status: MembershipStatus;
  created_at: string;
};

export type MembershipWithSociety = Membership & {
  societies: Pick<Society, 'id' | 'name' | 'code' | 'plan'> | null;
  flats: {
    id: string;
    flat_number: string;
    blocks: { name: string } | null;
  } | null;
};

export type PendingMembership = {
  id: string;
  role: MembershipRole;
  resident_type: ResidentType | null;
  member_type: ResidentMemberType | null;
  created_at: string;
  full_name: string | null;
  phone: string | null;
  flat_number: string | null;
  block_name: string | null;
};

export type FlatMember = {
  id: string;
  user_id: string;
  flat_id: string | null;
  role: MembershipRole;
  resident_type: ResidentType | null;
  member_type: ResidentMemberType | null;
  status: MembershipStatus;
  created_at: string;
  full_name: string | null;
  phone: string | null;
};

export async function createSociety(name: string, plan: SocietyPlan = 'free') {
  const { data, error } = await supabase.rpc('create_society', {
    p_name: name.trim(),
    p_plan: plan,
  });
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) throw new Error('Society was not created');
  return row as { id: string; name: string; code: string; plan: SocietyPlan };
}

export async function lookupSocietyByCode(code: string) {
  const { data, error } = await supabase.rpc('lookup_society_by_code', {
    p_code: code.trim().toUpperCase(),
  });
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  return (row as { id: string; name: string } | undefined) ?? null;
}

export async function fetchMyMemberships() {
  const { data, error } = await supabase
    .from('memberships')
    .select(
      'id, user_id, society_id, flat_id, role, resident_type, member_type, status, created_at, societies(id, name, code, plan), flats(id, flat_number, blocks(name))',
    )
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as MembershipWithSociety[];
}

export async function requestMembership(input: {
  societyId: string;
  role: 'resident' | 'guard';
  flatId?: string;
  residentType?: ResidentType;
  memberType?: ResidentMemberType;
}) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError) throw userError;
  if (!user) throw new Error('Not signed in');

  const { data, error } = await supabase
    .from('memberships')
    .insert({
      user_id: user.id,
      society_id: input.societyId,
      role: input.role,
      flat_id: input.role === 'resident' ? input.flatId ?? null : null,
      resident_type:
        input.role === 'resident' ? input.residentType ?? 'owner' : null,
      member_type:
        input.role === 'resident' ? input.memberType ?? 'primary' : null,
      status: 'pending',
    })
    .select(
      'id, user_id, society_id, flat_id, role, resident_type, member_type, status, created_at',
    )
    .single();

  if (error) throw error;
  return data as Membership;
}

export type FlatJoinInfo = {
  has_primary: boolean;
  has_approved_primary: boolean;
  primary_resident_type: ResidentType | null;
};

export async function fetchFlatJoinInfo(flatId: string) {
  const { data, error } = await supabase.rpc('get_flat_join_info', {
    p_flat_id: flatId,
  });
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  return (
    (row as FlatJoinInfo | undefined) ?? {
      has_primary: false,
      has_approved_primary: false,
      primary_resident_type: null,
    }
  );
}

export async function fetchPendingHousehold(flatId: string) {
  const { data, error } = await supabase.rpc('list_pending_household', {
    p_flat_id: flatId,
  });
  if (error) throw error;
  return (data ?? []) as PendingMembership[];
}

export async function fetchSocietyBlocks(societyId: string) {
  const { data, error } = await supabase
    .from('blocks')
    .select('id, society_id, type, name, created_at')
    .eq('society_id', societyId)
    .order('name', { ascending: true });
  if (error) throw error;
  return (data ?? []) as Block[];
}

export async function createBlock(
  societyId: string,
  name: string,
  type: BlockType = 'block',
) {
  const { data, error } = await supabase
    .from('blocks')
    .insert({
      society_id: societyId,
      name: name.trim(),
      type,
    })
    .select('id, society_id, type, name, created_at')
    .single();
  if (error) throw error;
  return data as Block;
}

export async function updateBlock(
  blockId: string,
  input: { name?: string; type?: BlockType },
) {
  const payload: { name?: string; type?: BlockType } = {};
  if (input.name !== undefined) payload.name = input.name.trim();
  if (input.type !== undefined) payload.type = input.type;

  const { data, error } = await supabase
    .from('blocks')
    .update(payload)
    .eq('id', blockId)
    .select('id, society_id, type, name, created_at')
    .single();
  if (error) throw error;
  return data as Block;
}

export function formatBlockTypeLabel(type: BlockType): string {
  if (type === 'other') return 'Other';
  return type.charAt(0).toUpperCase() + type.slice(1);
}

export async function fetchSocietyFlats(societyId: string) {
  // SECURITY DEFINER RPC — joiners are not members yet, so table RLS would hide flats.
  const { data, error } = await supabase.rpc('list_flats_for_society', {
    p_society_id: societyId,
  });
  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: row.id,
    society_id: societyId,
    block_id: row.block_id,
    flat_number: row.flat_number,
    created_at: '',
    block_name: row.block_name,
  })) as Flat[];
}

export async function createFlat(
  societyId: string,
  flatNumber: string,
  blockId?: string | null,
) {
  const { data, error } = await supabase
    .from('flats')
    .insert({
      society_id: societyId,
      flat_number: flatNumber.trim(),
      block_id: blockId ?? null,
    })
    .select('id, society_id, block_id, flat_number, created_at')
    .single();
  if (error) throw error;
  return data as Flat;
}

export async function createFlatsInRange(
  societyId: string,
  start: string,
  end: string,
  blockId?: string | null,
) {
  const { numbers, error: rangeError } = parseNumericFlatRange(start, end);
  if (rangeError) throw new Error(rangeError);
  if (numbers.length === 0) throw new Error('No flats to create');

  const rows = numbers.map((flat_number) => ({
    society_id: societyId,
    flat_number,
    block_id: blockId ?? null,
  }));

  const { data, error } = await supabase
    .from('flats')
    .insert(rows)
    .select('id, society_id, block_id, flat_number, created_at');

  if (error) throw error;
  return (data ?? []) as Flat[];
}

export async function listFlatMembers(flatId: string) {
  const { data, error } = await supabase
    .from('memberships')
    .select(
      'id, user_id, flat_id, role, resident_type, member_type, status, created_at, users(full_name, phone)',
    )
    .eq('flat_id', flatId)
    .in('status', ['approved', 'pending'])
    .order('created_at', { ascending: true });

  if (error) throw error;

  return (data ?? []).map((row) => {
    const users = row.users as {
      full_name: string | null;
      phone: string | null;
    } | null;

    return {
      id: row.id,
      user_id: row.user_id,
      flat_id: row.flat_id,
      role: row.role,
      resident_type: row.resident_type,
      member_type: row.member_type,
      status: row.status,
      created_at: row.created_at,
      full_name: users?.full_name ?? null,
      phone: users?.phone ?? null,
    } satisfies FlatMember;
  });
}

export async function fetchPendingMemberships(societyId: string) {
  const { data, error } = await supabase.rpc('list_pending_memberships', {
    p_society_id: societyId,
  });

  if (!error) {
    return (data ?? []) as PendingMembership[];
  }

  // Fallback if RPC missing / failed — direct admin-readable query.
  const { data: rows, error: fallbackError } = await supabase
    .from('memberships')
    .select(
      'id, role, resident_type, member_type, created_at, users(full_name, phone), flats(flat_number, blocks(name))',
    )
    .eq('society_id', societyId)
    .eq('status', 'pending')
    .order('created_at', { ascending: true });

  if (fallbackError) {
    throw new Error(
      error.message ||
        fallbackError.message ||
        'Could not load pending joins',
    );
  }

  return (rows ?? []).map((row) => {
    const users = row.users as {
      full_name: string | null;
      phone: string | null;
    } | null;
    const flats = row.flats as {
      flat_number: string;
      blocks: { name: string } | null;
    } | null;

    return {
      id: row.id,
      role: row.role,
      resident_type: row.resident_type,
      member_type: row.member_type,
      created_at: row.created_at,
      full_name: users?.full_name ?? null,
      phone: users?.phone ?? null,
      flat_number: flats?.flat_number ?? null,
      block_name: flats?.blocks?.name ?? null,
    } satisfies PendingMembership;
  });
}

export async function updateMembershipStatus(
  membershipId: string,
  status: 'approved' | 'rejected',
) {
  const { data, error } = await supabase
    .from('memberships')
    .update({ status })
    .eq('id', membershipId)
    .select(
      'id, user_id, society_id, flat_id, role, resident_type, member_type, status, created_at',
    )
    .single();
  if (error) throw error;
  return data as Membership;
}

/** Sequential batch updates — sufficient for hackathon pending queue. */
export async function batchUpdateMembershipStatus(
  membershipIds: string[],
  status: 'approved' | 'rejected',
) {
  const results: Membership[] = [];
  for (const membershipId of membershipIds) {
    results.push(await updateMembershipStatus(membershipId, status));
  }
  return results;
}

export async function fetchSociety(societyId: string) {
  const { data, error } = await supabase
    .from('societies')
    .select('id, name, code, plan, flat_limit, created_at')
    .eq('id', societyId)
    .maybeSingle();
  if (error) throw error;
  return data as Society | null;
}

export function formatFlatLabel(
  flat: Pick<Flat, 'flat_number' | 'block_name'>,
) {
  if (flat.block_name) return `${flat.block_name} · ${flat.flat_number}`;
  return flat.flat_number;
}

export function membershipFlatLabel(
  membership: Pick<MembershipWithSociety, 'flats' | 'role'>,
): string | null {
  if (membership.role !== 'resident') return null;
  const flat = membership.flats;
  if (!flat) return 'Flat not set';
  const blockName = flat.blocks?.name ?? null;
  return formatFlatLabel({
    flat_number: flat.flat_number,
    block_name: blockName,
  });
}

export function pendingFlatLabel(row: PendingMembership): string | null {
  if (row.role !== 'resident') return null;
  if (!row.flat_number) return 'Flat not set';
  return formatFlatLabel({
    flat_number: row.flat_number,
    block_name: row.block_name,
  });
}
