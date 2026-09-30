import type { Bet, BetResult, BetStatus } from "@/types";

// Mock bets for testing tables and stats without touching the database.
// Every bet is on the draw; derived fields (advantage, profit, profit_units)
// use the same formulas as the generated columns in the bets table.

const MOCK_USER_ID = "00000000-0000-0000-0000-000000000000";
const UNIT_VALUE = 10; // € per unit

const round = (n: number) => Math.round(n * 100) / 100;

type MockBetInput = {
  id: number;
  progressionId: number;
  attempt: number;
  date: string;
  home: string;
  away: string;
  stake: number; // units
  odds: number;
  drawPercentage: number;
  result: BetResult | null;
  status?: BetStatus; // defaults to won/lost from the result, pending if none
};

const mockBet = ({
  id,
  progressionId,
  attempt,
  date,
  home,
  away,
  stake,
  odds,
  drawPercentage,
  result,
  status,
}: MockBetInput): Bet => {
  const amount = stake * UNIT_VALUE;
  const finalStatus: BetStatus =
    status ?? (result === null ? "pending" : result === "draw" ? "won" : "lost");

  const profitFor = (value: number) =>
    finalStatus === "won"
      ? round(value * (odds - 1))
      : finalStatus === "lost"
        ? -value
        : 0;

  return {
    id,
    user_id: MOCK_USER_ID,
    progression_id: progressionId,
    attempt_number: attempt,
    match_date: `${date}T18:00:00Z`,
    home_team: home,
    away_team: away,
    result,
    stake,
    amount,
    odds,
    status: finalStatus,
    draw_percentage: drawPercentage,
    advantage: round(drawPercentage - 100 / odds),
    profit: profitFor(amount),
    profit_units: profitFor(stake),
    created_at: `${date}T12:00:00Z`,
  };
};

export const mockBets: Bet[] = [
  // Progression 1: won on attempt 3
  mockBet({ id: 1, progressionId: 1, attempt: 1, date: "2026-08-02", home: "Getafe", away: "Osasuna", stake: 1, odds: 3.2, drawPercentage: 33, result: "home_win" }),
  mockBet({ id: 2, progressionId: 1, attempt: 2, date: "2026-08-05", home: "Torino", away: "Udinese", stake: 1.5, odds: 3.1, drawPercentage: 34, result: "away_win" }),
  mockBet({ id: 3, progressionId: 1, attempt: 3, date: "2026-08-09", home: "Brentford", away: "Fulham", stake: 2.5, odds: 3.4, drawPercentage: 31, result: "draw" }),

  // Progression 2: won on attempt 1
  mockBet({ id: 4, progressionId: 2, attempt: 1, date: "2026-08-12", home: "Lens", away: "Nantes", stake: 1, odds: 3.25, drawPercentage: 32.5, result: "draw" }),

  // Progression 3: one void (postponed match), then won on attempt 5
  mockBet({ id: 5, progressionId: 3, attempt: 1, date: "2026-08-16", home: "Mallorca", away: "Alavés", stake: 1, odds: 3.0, drawPercentage: 35, result: "home_win" }),
  mockBet({ id: 6, progressionId: 3, attempt: 2, date: "2026-08-19", home: "Genoa", away: "Empoli", stake: 1.5, odds: 3.15, drawPercentage: 33, result: null, status: "void" }),
  mockBet({ id: 7, progressionId: 3, attempt: 3, date: "2026-08-23", home: "Everton", away: "Wolves", stake: 1.5, odds: 3.3, drawPercentage: 30, result: "away_win" }),
  mockBet({ id: 8, progressionId: 3, attempt: 4, date: "2026-08-26", home: "Augsburg", away: "Mainz", stake: 2.5, odds: 3.5, drawPercentage: 29, result: "home_win" }),
  mockBet({ id: 9, progressionId: 3, attempt: 5, date: "2026-08-30", home: "Montpellier", away: "Reims", stake: 4, odds: 3.2, drawPercentage: 33.5, result: "draw" }),

  // Progression 4: won on attempt 2
  mockBet({ id: 10, progressionId: 4, attempt: 1, date: "2026-09-03", home: "Celta Vigo", away: "Valladolid", stake: 1, odds: 3.1, drawPercentage: 31, result: "away_win" }),
  mockBet({ id: 11, progressionId: 4, attempt: 2, date: "2026-09-07", home: "Crystal Palace", away: "Bournemouth", stake: 1.5, odds: 3.45, drawPercentage: 30, result: "draw" }),

  // Progression 5: active — two losses, next bet pending
  mockBet({ id: 12, progressionId: 5, attempt: 1, date: "2026-09-14", home: "Bologna", away: "Lecce", stake: 1, odds: 3.35, drawPercentage: 31, result: "home_win" }),
  mockBet({ id: 13, progressionId: 5, attempt: 2, date: "2026-09-21", home: "Freiburg", away: "Wolfsburg", stake: 1.5, odds: 3.6, drawPercentage: 27, result: "home_win" }),
  mockBet({ id: 14, progressionId: 5, attempt: 3, date: "2026-10-01", home: "Rayo Vallecano", away: "Girona", stake: 2.5, odds: 3.3, drawPercentage: 32, result: null }),
];
