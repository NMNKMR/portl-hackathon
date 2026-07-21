import { supabase } from '@/lib/supabase';
import type {
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

export type Flat = {
  id: string;
  society_id: string;
  block_id: string | null;
  flat_number: string;
  created_at: string;
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
      'id, user_id, society_id, flat_id, role, resident_type, member_type, status, created_at, societies(id, name, code, plan)',
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

export async function fetchSocietyFlats(societyId: string) {
  // SECURITY DEFINER RPC — joiners are not members yet, so table RLS would hide flats.
  const { data, error } = await supabase.rpc('list_flats_for_society', {
    p_society_id: societyId,
  });
  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: row.id,
    society_id: societyId,
    block_id: null,
    flat_number: row.flat_number,
    created_at: '',
  })) as Flat[];
}

export async function createFlat(societyId: string, flatNumber: string) {
  const { data, error } = await supabase
    .from('flats')
    .insert({
      society_id: societyId,
      flat_number: flatNumber.trim(),
    })
    .select('id, society_id, block_id, flat_number, created_at')
    .single();
  if (error) throw error;
  return data as Flat;
}

export async function fetchPendingMemberships(societyId: string) {
  const { data, error } = await supabase
    .from('memberships')
    .select(
      'id, user_id, society_id, flat_id, role, resident_type, member_type, status, created_at, users(id, full_name, phone), flats(id, flat_number)',
    )
    .eq('society_id', societyId)
    .eq('status', 'pending')
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data ?? [];
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

export async function fetchSociety(societyId: string) {
  const { data, error } = await supabase
    .from('societies')
    .select('id, name, code, plan, flat_limit, created_at')
    .eq('id', societyId)
    .maybeSingle();
  if (error) throw error;
  return data as Society | null;
}
