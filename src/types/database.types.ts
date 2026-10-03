export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      bets: {
        Row: {
          advantage: number | null;
          amount: number;
          attempt_number: number;
          away_team: string;
          created_at: string;
          draw_percentage: number;
          home_team: string;
          id: number;
          match_date: string;
          odds: number;
          profit: number | null;
          profit_units: number | null;
          progression_id: number;
          result: string | null;
          stake: number;
          status: string;
          user_id: string;
        };
        Insert: {
          advantage?: number | null;
          amount: number;
          attempt_number: number;
          away_team: string;
          created_at?: string;
          draw_percentage: number;
          home_team: string;
          id?: never;
          match_date?: string;
          odds: number;
          profit?: number | null;
          profit_units?: number | null;
          progression_id: number;
          result?: string | null;
          stake: number;
          status?: string;
          user_id?: string;
        };
        Update: {
          advantage?: number | null;
          amount?: number;
          attempt_number?: number;
          away_team?: string;
          created_at?: string;
          draw_percentage?: number;
          home_team?: string;
          id?: never;
          match_date?: string;
          odds?: number;
          profit?: number | null;
          profit_units?: number | null;
          progression_id?: number;
          result?: string | null;
          stake?: number;
          status?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "bets_progression_id_user_id_fkey";
            columns: ["progression_id", "user_id"];
            isOneToOne: false;
            referencedRelation: "progression_stats";
            referencedColumns: ["progression_id", "user_id"];
          },
          {
            foreignKeyName: "bets_progression_id_user_id_fkey";
            columns: ["progression_id", "user_id"];
            isOneToOne: false;
            referencedRelation: "progressions";
            referencedColumns: ["id", "user_id"];
          },
        ];
      };
      model_results: {
        Row: {
          added: boolean;
          att_delta: number | null;
          away_att: number | null;
          away_def: number | null;
          away_draw_pct: number | null;
          away_games: number | null;
          away_team: string;
          away_used_split: boolean | null;
          draw_percentage: number;
          game_date: string;
          home_att: number | null;
          home_def: number | null;
          home_draw_pct: number | null;
          home_games: number | null;
          home_team: string;
          home_used_split: boolean | null;
          id: number;
          lambda_away: number | null;
          lambda_home: number | null;
          league: string;
          league_draw_rate: number | null;
          league_id: string;
          match_date: string;
          method: string | null;
          prob: number;
          prob_poisson: number | null;
          rank_gap: number | null;
          rho: number | null;
          score: number | null;
          scraped_at: string;
        };
        Insert: {
          att_delta?: number | null;
          away_att?: number | null;
          away_def?: number | null;
          away_draw_pct?: number | null;
          away_games?: number | null;
          away_team: string;
          away_used_split?: boolean | null;
          draw_percentage: number;
          game_date: string;
          home_att?: number | null;
          home_def?: number | null;
          home_draw_pct?: number | null;
          home_games?: number | null;
          home_team: string;
          home_used_split?: boolean | null;
          id?: never;
          lambda_away?: number | null;
          lambda_home?: number | null;
          league: string;
          league_draw_rate?: number | null;
          league_id: string;
          match_date: string;
          method?: string | null;
          prob: number;
          prob_poisson?: number | null;
          rank_gap?: number | null;
          rho?: number | null;
          score?: number | null;
          scraped_at: string;
        };
        Update: {
          added?: boolean;
          att_delta?: number | null;
          away_att?: number | null;
          away_def?: number | null;
          away_draw_pct?: number | null;
          away_games?: number | null;
          away_team?: string;
          away_used_split?: boolean | null;
          draw_percentage?: number;
          game_date?: string;
          home_att?: number | null;
          home_def?: number | null;
          home_draw_pct?: number | null;
          home_games?: number | null;
          home_team?: string;
          home_used_split?: boolean | null;
          id?: never;
          lambda_away?: number | null;
          lambda_home?: number | null;
          league?: string;
          league_draw_rate?: number | null;
          league_id?: string;
          match_date?: string;
          method?: string | null;
          prob?: number;
          prob_poisson?: number | null;
          rank_gap?: number | null;
          rho?: number | null;
          score?: number | null;
          scraped_at?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          created_at: string;
          first_name: string | null;
          id: string;
          last_name: string | null;
          total_budget: number;
          username: string | null;
        };
        Insert: {
          avatar_url?: string | null;
          created_at?: string;
          first_name?: string | null;
          id: string;
          last_name?: string | null;
          total_budget?: number;
          username?: string | null;
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string;
          first_name?: string | null;
          id?: string;
          last_name?: string | null;
          total_budget?: number;
          username?: string | null;
        };
        Relationships: [];
      };
      progressions: {
        Row: {
          created_at: string;
          end_date: string | null;
          id: number;
          start_date: string;
          status: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          end_date?: string | null;
          id?: never;
          start_date?: string;
          status?: string;
          user_id?: string;
        };
        Update: {
          created_at?: string;
          end_date?: string | null;
          id?: never;
          start_date?: string;
          status?: string;
          user_id?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      progression_stats: {
        Row: {
          end_date: string | null;
          profit: number | null;
          profit_units: number | null;
          progression_id: number | null;
          start_date: string | null;
          status: string | null;
          total_attempts: number | null;
          total_bet_amount: number | null;
          total_stake_units: number | null;
          user_id: string | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
