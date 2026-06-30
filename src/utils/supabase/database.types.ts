export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      sessions: {
        Row: {
          id: string;
          title: string;
          date: string;
          start_time: string;
          end_time: string;
          location: string;
          court_number: string;
          skill_level: string;
          max_players: number;
          status: string;
          created_at: string;
          court_count: number;
          target_score: number;
          win_by: number;
          payment_required: boolean;
          payment_amount: number | null;
          payment_note: string | null;
          payment_instructions: string | null;
          allow_unpaid_in_queue: boolean;
          auto_assign_next_match: boolean;
          allow_side_change: boolean;
          side_change_point: number;
          skill_matching_mode: string;
        };
        Insert: {
          id?: string;
          title: string;
          date: string;
          start_time: string;
          end_time: string;
          location: string;
          court_number: string;
          skill_level: string;
          max_players: number;
          status?: string;
          created_at?: string;
          court_count?: number;
          target_score?: number;
          win_by?: number;
          payment_required?: boolean;
          payment_amount?: number | null;
          payment_note?: string | null;
          payment_instructions?: string | null;
          allow_unpaid_in_queue?: boolean;
          auto_assign_next_match?: boolean;
          allow_side_change?: boolean;
          side_change_point?: number;
          skill_matching_mode?: string;
        };
        Update: {
          id?: string;
          title?: string;
          date?: string;
          start_time?: string;
          end_time?: string;
          location?: string;
          court_number?: string;
          skill_level?: string;
          max_players?: number;
          status?: string;
          created_at?: string;
          court_count?: number;
          target_score?: number;
          win_by?: number;
          payment_required?: boolean;
          payment_amount?: number | null;
          payment_note?: string | null;
          payment_instructions?: string | null;
          allow_unpaid_in_queue?: boolean;
          auto_assign_next_match?: boolean;
          allow_side_change?: boolean;
          side_change_point?: number;
          skill_matching_mode?: string;
        };
        Relationships: [];
      };
      players: {
        Row: {
          id: string;
          session_id: string;
          user_id: string | null;
          name: string;
          contact_number: string | null;
          gender: string | null;
          skill_level: string;
          joined_at: string;
          status: string;
          note: string | null;
          games_played: number;
          wins: number;
          losses: number;
          last_played_at: string | null;
          checked_in_at: string | null;
          secured_at: string | null;
          is_active: boolean;
          partner_id: string | null;
        };
        Insert: {
          id?: string;
          session_id: string;
          user_id?: string | null;
          name: string;
          contact_number?: string | null;
          gender?: string | null;
          skill_level: string;
          joined_at?: string;
          status?: string;
          note?: string | null;
          games_played?: number;
          wins?: number;
          losses?: number;
          last_played_at?: string | null;
          checked_in_at?: string | null;
          secured_at?: string | null;
          is_active?: boolean;
          partner_id?: string | null;
        };
        Update: {
          id?: string;
          session_id?: string;
          user_id?: string | null;
          name?: string;
          contact_number?: string | null;
          gender?: string | null;
          skill_level?: string;
          joined_at?: string;
          status?: string;
          note?: string | null;
          games_played?: number;
          wins?: number;
          losses?: number;
          last_played_at?: string | null;
          checked_in_at?: string | null;
          secured_at?: string | null;
          is_active?: boolean;
          partner_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "players_session_id_fkey";
            columns: ["session_id"];
            isOneToOne: false;
            referencedRelation: "sessions";
            referencedColumns: ["id"];
          },
        ];
      };
      courts: {
        Row: {
          id: string;
          session_id: string;
      court_number: number;
      status: string;
      created_at: string;
      rental_start_time: string | null;
      rental_end_time: string | null;
      sides_swapped: boolean;
          side_change_count: number;
          last_side_change_at: string | null;
        };
        Insert: {
          id?: string;
          session_id: string;
          court_number: number;
          status?: string;
          created_at?: string;
          rental_start_time?: string | null;
          rental_end_time?: string | null;
          sides_swapped?: boolean;
          side_change_count?: number;
          last_side_change_at?: string | null;
        };
        Update: {
          id?: string;
          session_id?: string;
          court_number?: number;
          status?: string;
          created_at?: string;
          rental_start_time?: string | null;
          rental_end_time?: string | null;
          sides_swapped?: boolean;
          side_change_count?: number;
          last_side_change_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "courts_session_id_fkey";
            columns: ["session_id"];
            isOneToOne: false;
            referencedRelation: "sessions";
            referencedColumns: ["id"];
          },
        ];
      };
      matches: {
        Row: {
          id: string;
          session_id: string;
          court_id: string | null;
          team_a_player_1: string | null;
          team_a_player_2: string | null;
          team_b_player_1: string | null;
          team_b_player_2: string | null;
          team_a_score: number | null;
          team_b_score: number | null;
          winner_team: string | null;
          status: string;
          started_at: string | null;
          finished_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          court_id?: string | null;
          team_a_player_1?: string | null;
          team_a_player_2?: string | null;
          team_b_player_1?: string | null;
          team_b_player_2?: string | null;
          team_a_score?: number | null;
          team_b_score?: number | null;
          winner_team?: string | null;
          status?: string;
          started_at?: string | null;
          finished_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          session_id?: string;
          court_id?: string | null;
          team_a_player_1?: string | null;
          team_a_player_2?: string | null;
          team_b_player_1?: string | null;
          team_b_player_2?: string | null;
          team_a_score?: number | null;
          team_b_score?: number | null;
          winner_team?: string | null;
          status?: string;
          started_at?: string | null;
          finished_at?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      session_activity: {
        Row: {
          id: string;
          session_id: string;
          court_id: string | null;
          message: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          court_id?: string | null;
          message: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          session_id?: string;
          court_id?: string | null;
          message?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      test_player_templates: {
        Row: {
          id: string;
          name: string;
          skill_level: string;
          default_status: string;
          games_played: number;
          contact_number: string | null;
          note: string | null;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          skill_level: string;
          default_status?: string;
          games_played?: number;
          contact_number?: string | null;
          note?: string | null;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          skill_level?: string;
          default_status?: string;
          games_played?: number;
          contact_number?: string | null;
          note?: string | null;
          sort_order?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string;
          contact_number: string | null;
          gender: string;
          skill_level: string;
          role: string;
          created_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name: string;
          contact_number?: string | null;
          gender: string;
          skill_level: string;
          role?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string;
          contact_number?: string | null;
          gender?: string;
          skill_level?: string;
          role?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      activity_logs: {
        Row: {
          id: string;
          session_id: string;
          event_type: string;
          title: string;
          description: string;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          event_type: string;
          title: string;
          description?: string;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          session_id?: string;
          event_type?: string;
          title?: string;
          description?: string;
          metadata?: Json;
          created_at?: string;
        };
        Relationships: [];
      };
      admins: {
        Row: {
          id: string;
          email: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      is_admin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      add_test_players_to_session: {
        Args: { p_session_id: string };
        Returns: number;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export type SessionRow = Database["public"]["Tables"]["sessions"]["Row"];
export type PlayerRow = Database["public"]["Tables"]["players"]["Row"];
export type CourtRow = Database["public"]["Tables"]["courts"]["Row"];
export type MatchRow = Database["public"]["Tables"]["matches"]["Row"];
export type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
export type ActivityLogRow = Database["public"]["Tables"]["activity_logs"]["Row"];
