/**
 * TypeScript types generated from the Supabase database schema.
 *
 * To regenerate after schema changes:
 *   npx supabase gen types typescript --project-id <your-project-id> > lib/database.types.ts
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = "super_admin" | "election_creator" | "voter";
export type ElectionStatus = "draft" | "active" | "locked" | "completed" | "cancelled";
export type RegistrationStatus = "registered" | "waitlisted" | "admitted" | "rejected";
export type CreatorRequestStatus = "pending" | "approved" | "rejected";
export type AuditAction =
  | "election_created"
  | "election_updated"
  | "election_started"
  | "election_ended"
  | "election_locked"
  | "voter_registered"
  | "voter_waitlisted"
  | "voter_admitted"
  | "vote_cast"
  | "admin_override"
  | "creator_approved"
  | "creator_rejected"
  | "secret_id_generated"
  | "secret_id_verified";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          role: UserRole;
          organization: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          role?: UserRole;
          organization?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          role?: UserRole;
          organization?: string | null;
          updated_at?: string;
        };
      };
      creator_requests: {
        Row: {
          id: string;
          reference_id: string;
          user_id: string | null;
          first_name: string;
          last_name: string;
          email: string;
          phone: string;
          organization_name: string;
          organization_type: string;
          purpose: string;
          expected_voters: string;
          status: CreatorRequestStatus;
          reviewed_by: string | null;
          rejection_reason: string | null;
          submitted_at: string;
          reviewed_at: string | null;
        };
        Insert: {
          id?: string;
          reference_id?: string;
          user_id?: string | null;
          first_name: string;
          last_name: string;
          email: string;
          phone: string;
          organization_name: string;
          organization_type: string;
          purpose: string;
          expected_voters: string;
          status?: CreatorRequestStatus;
          reviewed_by?: string | null;
          rejection_reason?: string | null;
          submitted_at?: string;
          reviewed_at?: string | null;
        };
        Update: {
          status?: CreatorRequestStatus;
          reviewed_by?: string | null;
          rejection_reason?: string | null;
          reviewed_at?: string | null;
        };
      };
      elections: {
        Row: {
          id: string;
          creator_id: string;
          title: string;
          description: string | null;
          organization: string;
          status: ElectionStatus;
          starts_at: string | null;
          ends_at: string | null;
          registration_deadline: string | null;
          max_voters: number;
          registered_count: number;
          waitlist_count: number;
          votes_cast: number;
          is_public: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          creator_id: string;
          title: string;
          description?: string | null;
          organization: string;
          status?: ElectionStatus;
          starts_at?: string | null;
          ends_at?: string | null;
          registration_deadline?: string | null;
          max_voters?: number;
          registered_count?: number;
          waitlist_count?: number;
          votes_cast?: number;
          is_public?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string;
          description?: string | null;
          organization?: string;
          status?: ElectionStatus;
          starts_at?: string | null;
          ends_at?: string | null;
          registration_deadline?: string | null;
          max_voters?: number;
          registered_count?: number;
          waitlist_count?: number;
          votes_cast?: number;
          is_public?: boolean;
          updated_at?: string;
        };
      };
      candidates: {
        Row: {
          id: string;
          election_id: string;
          name: string;
          photo_url: string | null;
          manifesto: string | null;
          vote_count: number;
          position: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          election_id: string;
          name: string;
          photo_url?: string | null;
          manifesto?: string | null;
          vote_count?: number;
          position?: number;
          created_at?: string;
        };
        Update: {
          name?: string;
          photo_url?: string | null;
          manifesto?: string | null;
          vote_count?: number;
          position?: number;
        };
      };
      registrations: {
        Row: {
          id: string;
          election_id: string;
          voter_id: string;
          status: RegistrationStatus;
          secret_poll_id: string | null;
          has_voted: boolean;
          registered_at: string;
          admitted_at: string | null;
        };
        Insert: {
          id?: string;
          election_id: string;
          voter_id: string;
          status?: RegistrationStatus;
          secret_poll_id?: string | null;
          has_voted?: boolean;
          registered_at?: string;
          admitted_at?: string | null;
        };
        Update: {
          status?: RegistrationStatus;
          secret_poll_id?: string | null;
          has_voted?: boolean;
          admitted_at?: string | null;
        };
      };
      votes: {
        Row: {
          id: string;
          election_id: string;
          candidate_id: string;
          cast_at: string;
        };
        Insert: {
          id?: string;
          election_id: string;
          candidate_id: string;
          cast_at?: string;
        };
        Update: never;
      };
      audit_logs: {
        Row: {
          id: string;
          election_id: string | null;
          actor_id: string | null;
          action: AuditAction;
          details: Json;
          ip_address: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          election_id?: string | null;
          actor_id?: string | null;
          action: AuditAction;
          details?: Json;
          ip_address?: string | null;
          created_at?: string;
        };
        Update: never;
      };
    };
    Functions: {
      cast_vote: {
        Args: {
          p_election_id: string;
          p_candidate_id: string;
          p_secret_id: string;
        };
        Returns: Json;
      };
      verify_secret_id: {
        Args: {
          p_election_id: string;
          p_secret_id: string;
        };
        Returns: Json;
      };
      verify_secret_id_v2: {
        Args: {
          p_election_id: string;
          p_secret_id: string;
        };
        Returns: Json;
      };
      register_for_election: {
        Args: { p_election_id: string };
        Returns: Json;
      };
      admin_override_max_voters: {
        Args: {
          p_election_id: string;
          p_new_max: number;
          p_reason: string;
          p_actor_id: string;
        };
        Returns: Json;
      };
      approve_creator_request: {
        Args: {
          p_request_id: string;
          p_admin_id: string;
        };
        Returns: Json;
      };
      reject_creator_request: {
        Args: {
          p_request_id: string;
          p_admin_id: string;
          p_reason: string;
        };
        Returns: Json;
      };
      finalize_voter_registrations: {
        Args: { p_election_id: string };
        Returns: Array<{ voter_id: string; email: string; secret_poll_id: string }>;
      };
      lock_expired_elections: {
        Args: Record<string, never>;
        Returns: number;
      };
      get_my_role: {
        Args: Record<string, never>;
        Returns: UserRole;
      };
    };
    Enums: {
      user_role: UserRole;
      election_status: ElectionStatus;
      registration_status: RegistrationStatus;
      creator_request_status: CreatorRequestStatus;
      audit_action: AuditAction;
    };
  };
}

// ── Convenience row types ──────────────────────────────────────────────────
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Election = Database["public"]["Tables"]["elections"]["Row"];
export type Candidate = Database["public"]["Tables"]["candidates"]["Row"];
export type Registration = Database["public"]["Tables"]["registrations"]["Row"];
export type Vote = Database["public"]["Tables"]["votes"]["Row"];
export type AuditLog = Database["public"]["Tables"]["audit_logs"]["Row"];
export type CreatorRequest = Database["public"]["Tables"]["creator_requests"]["Row"];
