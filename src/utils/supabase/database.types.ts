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
        };
        Relationships: [];
      };
      players: {
        Row: {
          id: string;
          session_id: string;
          name: string;
          contact_number: string | null;
          skill_level: string;
          joined_at: string;
          status: string;
          note: string | null;
          games_played: number;
          last_played_at: string | null;
          checked_in_at: string | null;
          secured_at: string | null;
          is_active: boolean;
        };
        Insert: {
          id?: string;
          session_id: string;
          name: string;
          contact_number?: string | null;
          skill_level: string;
          joined_at?: string;
          status?: string;
          note?: string | null;
          games_played?: number;
          last_played_at?: string | null;
          checked_in_at?: string | null;
          secured_at?: string | null;
          is_active?: boolean;
        };
        Update: {
          id?: string;
          session_id?: string;
          name?: string;
          contact_number?: string | null;
          skill_level?: string;
          joined_at?: string;
          status?: string;
          note?: string | null;
          games_played?: number;
          last_played_at?: string | null;
          checked_in_at?: string | null;
          secured_at?: string | null;
          is_active?: boolean;
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
        };
        Insert: {
          id?: string;
          session_id: string;
          court_number: number;
          status?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          session_id?: string;
          court_number?: number;
          status?: string;
          created_at?: string;
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
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export type SessionRow = Database["public"]["Tables"]["sessions"]["Row"];
export type PlayerRow = Database["public"]["Tables"]["players"]["Row"];
export type CourtRow = Database["public"]["Tables"]["courts"]["Row"];
export type MatchRow = Database["public"]["Tables"]["matches"]["Row"];
