/**
 * Minimal hand types until `supabase gen types` is run.
 * Keep in sync with context/schema.sql Tier-1 tables we touch.
 */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type SocietyPlan = 'free' | 'starter' | 'pro';
export type MembershipRole = 'admin' | 'resident' | 'guard';
export type MembershipStatus = 'pending' | 'approved' | 'rejected';
export type ResidentType = 'owner' | 'tenant';
export type ResidentMemberType = 'primary' | 'household';

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          full_name: string | null;
          phone: string | null;
          avatar_url: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          phone?: string | null;
          avatar_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          phone?: string | null;
          avatar_url?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      societies: {
        Row: {
          id: string;
          name: string;
          code: string;
          plan: SocietyPlan;
          flat_limit: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          code: string;
          plan?: SocietyPlan;
          flat_limit?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          code?: string;
          plan?: SocietyPlan;
          flat_limit?: number | null;
          created_at?: string;
        };
        Relationships: [];
      };
      flats: {
        Row: {
          id: string;
          society_id: string;
          block_id: string | null;
          flat_number: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          society_id: string;
          block_id?: string | null;
          flat_number: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          society_id?: string;
          block_id?: string | null;
          flat_number?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      memberships: {
        Row: {
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
        Insert: {
          id?: string;
          user_id: string;
          society_id: string;
          flat_id?: string | null;
          role: MembershipRole;
          resident_type?: ResidentType | null;
          member_type?: ResidentMemberType | null;
          status?: MembershipStatus;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          society_id?: string;
          flat_id?: string | null;
          role?: MembershipRole;
          resident_type?: ResidentType | null;
          member_type?: ResidentMemberType | null;
          status?: MembershipStatus;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      create_society: {
        Args: { p_name: string; p_plan?: SocietyPlan };
        Returns: {
          id: string;
          name: string;
          code: string;
          plan: SocietyPlan;
        }[];
      };
      lookup_society_by_code: {
        Args: { p_code: string };
        Returns: { id: string; name: string }[];
      };
      list_flats_for_society: {
        Args: { p_society_id: string };
        Returns: { id: string; flat_number: string }[];
      };
    };
    Enums: {
      society_plan: SocietyPlan;
      membership_role: MembershipRole;
      membership_status: MembershipStatus;
      resident_type: ResidentType;
      resident_member_type: ResidentMemberType;
    };
    CompositeTypes: Record<string, never>;
  };
};
