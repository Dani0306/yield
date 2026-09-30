import type { Tables, TablesInsert, TablesUpdate } from "./database.types";

// Allowed values, mirroring the check constraints in the database.
export const BET_STATUSES = ["pending", "won", "lost", "void"] as const;
export const BET_RESULTS = ["home_win", "draw", "away_win"] as const;
export const PROGRESSION_STATUSES = ["active", "won", "lost", "abandoned"] as const;

export type BetStatus = (typeof BET_STATUSES)[number];
export type BetResult = (typeof BET_RESULTS)[number];
export type ProgressionStatus = (typeof PROGRESSION_STATUSES)[number];

// Columns the database calculates; never sent on insert or update.
type BetGeneratedColumns = "advantage" | "profit" | "profit_units";

export type Profile = Tables<"profiles">;
export type ProfileUpdate = Omit<TablesUpdate<"profiles">, "id" | "created_at">;

// The signed-in user: their profile plus the email from Supabase Auth
// (email lives in auth.users, not in profiles).
export type User = Profile & {
  email: string;
};

export type Progression = Omit<Tables<"progressions">, "status"> & {
  status: ProgressionStatus;
};
export type ProgressionInsert = Omit<TablesInsert<"progressions">, "status"> & {
  status?: ProgressionStatus;
};
export type ProgressionUpdate = Omit<TablesUpdate<"progressions">, "status"> & {
  status?: ProgressionStatus;
};

// A progression with its live totals, from the progression_stats view.
export type ProgressionWithStats = {
  progression_id: number;
  user_id: string;
  status: ProgressionStatus;
  start_date: string;
  end_date: string | null;
  total_attempts: number;
  total_bet_amount: number;
  total_stake_units: number;
  profit: number;
  profit_units: number;
};

export type Bet = Omit<Tables<"bets">, "status" | "result" | BetGeneratedColumns> & {
  status: BetStatus;
  result: BetResult | null;
  advantage: number;
  profit: number;
  profit_units: number;
};
export type BetInsert = Omit<TablesInsert<"bets">, "status" | "result" | BetGeneratedColumns> & {
  status?: BetStatus;
  result?: BetResult | null;
};
export type BetUpdate = Omit<TablesUpdate<"bets">, "status" | "result" | BetGeneratedColumns> & {
  status?: BetStatus;
  result?: BetResult | null;
};
