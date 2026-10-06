import type { Tables, TablesInsert, TablesUpdate } from "./database.types";

// Allowed values, mirroring the check constraints in the database.
export const BET_STATUSES = ["pending", "won", "lost", "void"] as const;
export const BET_RESULTS = ["home_win", "draw", "away_win", "void"] as const;
export const PROGRESSION_STATUSES = [
  "active",
  "won",
  "lost",
  "abandoned",
] as const;

// What happened in a match when settling a bet. Bets are always on the draw,
// so a draw wins and a home or away win loses.
export const SETTLE_OUTCOMES = [
  "draw",
  "home_win",
  "away_win",
  "void",
] as const;

export type BetStatus = (typeof BET_STATUSES)[number];
export type BetResult = (typeof BET_RESULTS)[number];
export type ProgressionStatus = (typeof PROGRESSION_STATUSES)[number];
export type SettleOutcome = (typeof SETTLE_OUTCOMES)[number];

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
  // Your 1st, 2nd, 3rd… progression. Shown in the app instead of the id.
  progression_number: number;
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

export type Bet = Omit<
  Tables<"bets">,
  "status" | "result" | BetGeneratedColumns
> & {
  status: BetStatus;
  result: BetResult | null;
  advantage: number;
  profit: number;
  profit_units: number;
  // The number of the progression this bet belongs to (see Progression).
  progression_number: number;
};
export type BetInsert = Omit<
  TablesInsert<"bets">,
  "status" | "result" | BetGeneratedColumns
> & {
  status?: BetStatus;
  result?: BetResult | null;
};
// What the new bet form sends. The progression, attempt number, stake and
// amount are worked out on the server from the staking rule.
export type CreateBetInput = {
  match_date: string;
  home_team: string;
  away_team: string;
  odds: number;
  draw_percentage: number;
  bookmaker: string;
  // The Draw odds result this bet was placed from, if any.
  model_result_id?: number;
};

export type BetUpdate = Omit<
  TablesUpdate<"bets">,
  "status" | "result" | BetGeneratedColumns
> & {
  status?: BetStatus;
  result?: BetResult | null;
};

// Everything the dashboard shows, in one object.
export type DashboardData = {
  // null when there's no active progression.
  currentProgression: {
    id: number;
    // Shown as "#2"; id is the database key.
    number: number;
    attempt: number;
    longestProgressionAttempts: number;
    investedAmount: number;
    investedUnits: number;
    // Invested so far as a % of the current bank.
    bankExposurePercent: number;
    // More losing attempts the bank can afford at the current stake growth.
    attemptsBankCanCover: number;
    // The open bet, if any, with what it returns if it wins.
    currentBet: {
      bet: Bet;
      potentialReturn: number;
      potentialProfit: number;
    } | null;
    // Stake for the next attempt (after the current bet, if it loses).
    nextStake: { units: number; amount: number };
    bets: Bet[];
  } | null;
  overview: {
    netProfit: number;
    netProfitUnits: number;
    startingBank: number;
    currentBank: number;
    bankGrowthPercent: number;
    roiPercent: number;
    // Total staked on settled bets (the base for ROI).
    totalStaked: number;
    drawHitRatePercent: number;
    settledBets: number;
    progressionsCompleted: number;
    progressionsAbandoned: number;
  };
  edge: {
    estimatedDrawRatePercent: number;
    actualDrawRatePercent: number;
    // Actual minus estimated, in percentage points. Negative = overestimating.
    drawRateGapPercent: number;
    averageAdvantagePercent: number;
  };
  // How you bet. null when there's no bet to base the figure on yet.
  patterns: {
    // Mean decimal odds across every bet placed.
    averageOdds: number | null;
    // Mean attempt number of the winning bets: how long a progression
    // usually runs before it wins.
    averageWinningAttempt: number | null;
    wonBets: number;
    // The furthest any progression has gone, and which one.
    highestAttempt: { attempt: number; progressionNumber: number } | null;
    // Most used bookmakers, most bets first (up to 3).
    topBookmakers: { name: string; bets: number }[];
    // The final score seen most often across settled bets, how that match
    // ended, how many times it happened and out of how many scored bets.
    mostCommonScore: {
      score: string;
      result: Exclude<BetResult, "void">;
      count: number;
      of: number;
    } | null;
    // The same, among draws only (e.g. 1-1 vs 0-0).
    mostCommonDrawScore: { score: string; count: number; of: number } | null;
    // Mean total goals (home + away) across the bets with a final score.
    averageGoals: { perGame: number; games: number } | null;
  };
  // The next selected match to bet on: the earliest one with no bet yet that
  // hasn't kicked off (and, with a bet pending, starts after it). null when
  // there's none.
  nextEvent: {
    resultId: number;
    homeTeam: string;
    awayTeam: string;
    league: string;
    drawPercentage: number;
    // Kick-off as an ISO timestamp, and minutes from now when loaded.
    kickOff: string;
    minutesUntil: number;
    // True when a bet is pending, so this one comes after it.
    afterPending: boolean;
  } | null;
  // `note` labels a notable point on the chart, e.g. an abandoned progression.
  profitOverTime: { date: string; cumulativeProfit: number; note?: string }[];
  recentProgressions: ProgressionWithStats[];
};

// One draw candidate from the prediction model (a row of its CSV export).
export type ModelResult = Tables<"model_results">;
export type ModelResultInsert = TablesInsert<"model_results">;
// One bookmaker's prices for a model result (result_odds table).
export type ResultOdds = Tables<"result_odds">;

// What the app knows about a result's odds: when they were last checked
// (null: never), whether an OddsPapi match was found, and the prices.
export type ResultOddsSummary = {
  checkedAt: string | null;
  matched: boolean;
  odds: ResultOdds[];
};

// The bet placed from a model result (see bets.model_result_id).
export type ResultBet = { id: number; status: BetStatus };

// The columns that identify one result (the table's unique key).
export type ModelResultKey = Pick<
  ModelResult,
  "match_date" | "home_team" | "away_team" | "scraped_at"
>;

export interface SearchParamProps {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}
