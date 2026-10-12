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
  // Stop-loss: closes after this many lost bets. null: none (progressions
  // from before the stop-loss).
  max_losses: number | null;
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
  // null for flat-stake bets, which belong to none.
  progression_number: number | null;
};
export type BetInsert = Omit<
  TablesInsert<"bets">,
  "status" | "result" | BetGeneratedColumns
> & {
  status?: BetStatus;
  result?: BetResult | null;
};
// What the new bet form sends. The stake and amount are worked out on the
// server from the staking rule.
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
  // The stake every new bet takes (flat: the same for every bet).
  stake: { percent: number; units: number; amount: number };
  // Bets waiting for a result, earliest match first, each with what it
  // returns if it wins and the state of its match.
  openBets: {
    bet: Bet;
    potentialReturn: number;
    potentialProfit: number;
    liveScore: LiveScore | null;
  }[];
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
    // Mean odds of the settled bets, and the hit rate times them: what each
    // peso staked comes back as at flat stakes. Above 1 the picks make
    // money. null before the first settled bet.
    settledAverageOdds: number | null;
    hitRateTimesOdds: number | null;
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
    // The most draws in a row, and the most settled bets in a row without
    // one (void bets are skipped). 0 before the first settled bet.
    longestWinningRun: number;
    longestLosingRun: number;
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
  // hasn't kicked off. null when there's none.
  nextEvent: {
    resultId: number;
    homeTeam: string;
    awayTeam: string;
    league: string;
    drawPercentage: number;
    // Kick-off as an ISO timestamp, and minutes from now when loaded.
    kickOff: string;
    minutesUntil: number;
  } | null;
  // Cumulative profit after each settled bet. `note` labels a notable point
  // on the chart, e.g. the first flat-stake bet.
  profitOverTime: { date: string; cumulativeProfit: number; note?: string }[];
  // The latest bets, newest match first.
  recentBets: Bet[];
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

// A pending bet's match: its final score once it ends, from the scores API.
// Scores read "home-away" ("1-0"). While it runs there's no score: the
// minute is worked out from the kick-off time (src/lib/utils/match-clock.ts).
export type LiveScore =
  | { state: "not_started" }
  | { state: "in_play" }
  | { state: "finished"; score: string; afterExtraTime: boolean }
  | { state: "cancelled" }
  // The API has no match for these teams at this kick-off.
  | { state: "not_found" }
  // The API failed or the monthly quota ran out.
  | { state: "unavailable" };

// The columns that identify one result (the table's unique key).
export type ModelResultKey = Pick<
  ModelResult,
  "match_date" | "home_team" | "away_team" | "scraped_at"
>;

export interface SearchParamProps {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}
