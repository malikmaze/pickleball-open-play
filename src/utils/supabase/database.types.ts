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
        };
        Insert: {
          id?: string;
          session_id: string;
          name: string;
          contact_number?: string | null;
          skill_level: string;
          joined_at?: string;
        };
        Update: {
          id?: string;
          session_id?: string;
          name?: string;
          contact_number?: string | null;
          skill_level?: string;
          joined_at?: string;
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
