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
export type BlockType = 'tower' | 'wing' | 'block' | 'other';
export type MembershipRole = 'admin' | 'resident' | 'guard';
export type MembershipStatus = 'pending' | 'approved' | 'rejected';
export type ResidentType = 'owner' | 'tenant';
export type ResidentMemberType = 'primary' | 'household';

export type VisitorType = 'guest' | 'delivery' | 'cab' | 'service' | 'other';
export type VisitorInitiator = 'guard' | 'resident';
export type VisitorStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'checked_in'
  | 'checked_out';
export type VehicleType = 'car' | 'bike' | 'other' | 'none';
export type ComplaintStatus = 'open' | 'in_progress' | 'resolved';

/** Hand types for Tier 2 staff tables (see schema.sql). */
export type StaffCategoryRow = {
  id: string;
  name: string;
  icon: string | null;
  is_system_default: boolean;
  society_id: string | null;
  created_at: string;
};

export type StaffDirectoryRow = {
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
};

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
      blocks: {
        Row: {
          id: string;
          society_id: string;
          type: BlockType;
          name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          society_id: string;
          type: BlockType;
          name: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          society_id?: string;
          type?: BlockType;
          name?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'blocks_society_id_fkey';
            columns: ['society_id'];
            isOneToOne: false;
            referencedRelation: 'societies';
            referencedColumns: ['id'];
          },
        ];
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
        Relationships: [
          {
            foreignKeyName: 'flats_society_id_fkey';
            columns: ['society_id'];
            isOneToOne: false;
            referencedRelation: 'societies';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'flats_block_id_fkey';
            columns: ['block_id'];
            isOneToOne: false;
            referencedRelation: 'blocks';
            referencedColumns: ['id'];
          },
        ];
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
        Relationships: [
          {
            foreignKeyName: 'memberships_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'memberships_society_id_fkey';
            columns: ['society_id'];
            isOneToOne: false;
            referencedRelation: 'societies';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'memberships_flat_id_fkey';
            columns: ['flat_id'];
            isOneToOne: false;
            referencedRelation: 'flats';
            referencedColumns: ['id'];
          },
        ];
      };
      visitor_requests: {
        Row: {
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
        };
        Insert: {
          id?: string;
          society_id: string;
          flat_id: string;
          guard_membership_id?: string | null;
          initiated_by: VisitorInitiator;
          visitor_name: string;
          visitor_phone?: string | null;
          visitor_type: VisitorType;
          photo_url?: string | null;
          vehicle_number?: string | null;
          vehicle_type?: VehicleType | null;
          status?: VisitorStatus;
          qr_token?: string | null;
          qr_expires_at?: string | null;
          max_scans?: number;
          scan_count?: number;
          requested_at?: string;
          approved_by_membership_id?: string | null;
          approved_at?: string | null;
          checked_in_at?: string | null;
          checked_out_at?: string | null;
        };
        Update: {
          id?: string;
          society_id?: string;
          flat_id?: string;
          guard_membership_id?: string | null;
          initiated_by?: VisitorInitiator;
          visitor_name?: string;
          visitor_phone?: string | null;
          visitor_type?: VisitorType;
          photo_url?: string | null;
          vehicle_number?: string | null;
          vehicle_type?: VehicleType | null;
          status?: VisitorStatus;
          qr_token?: string | null;
          qr_expires_at?: string | null;
          max_scans?: number;
          scan_count?: number;
          requested_at?: string;
          approved_by_membership_id?: string | null;
          approved_at?: string | null;
          checked_in_at?: string | null;
          checked_out_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'visitor_requests_society_id_fkey';
            columns: ['society_id'];
            isOneToOne: false;
            referencedRelation: 'societies';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'visitor_requests_flat_id_fkey';
            columns: ['flat_id'];
            isOneToOne: false;
            referencedRelation: 'flats';
            referencedColumns: ['id'];
          },
        ];
      };
      push_tokens: {
        Row: {
          id: string;
          user_id: string;
          expo_push_token: string;
          device_type: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          expo_push_token: string;
          device_type?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          expo_push_token?: string;
          device_type?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'push_tokens_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
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
        Returns: {
          id: string;
          flat_number: string;
          block_id: string | null;
          block_name: string | null;
        }[];
      };
      list_pending_memberships: {
        Args: { p_society_id: string };
        Returns: {
          id: string;
          role: MembershipRole;
          resident_type: ResidentType | null;
          member_type: ResidentMemberType | null;
          created_at: string;
          full_name: string | null;
          phone: string | null;
          flat_number: string | null;
          block_name: string | null;
        }[];
      };
      get_flat_join_info: {
        Args: { p_flat_id: string };
        Returns: {
          has_primary: boolean;
          has_approved_primary: boolean;
          primary_resident_type: ResidentType | null;
        }[];
      };
      list_pending_household: {
        Args: { p_flat_id: string };
        Returns: {
          id: string;
          role: MembershipRole;
          resident_type: ResidentType | null;
          member_type: ResidentMemberType | null;
          created_at: string;
          full_name: string | null;
          phone: string | null;
          flat_number: string | null;
          block_name: string | null;
        }[];
      };
    };
    Enums: {
      society_plan: SocietyPlan;
      block_type: BlockType;
      membership_role: MembershipRole;
      membership_status: MembershipStatus;
      resident_type: ResidentType;
      resident_member_type: ResidentMemberType;
      visitor_type: VisitorType;
      visitor_initiator: VisitorInitiator;
      visitor_status: VisitorStatus;
      vehicle_type: VehicleType;
    };
    CompositeTypes: Record<string, never>;
  };
};
