import type {
  Bet,
  Progression,
  ProgressionStatus,
  ProgressionWithStats,
} from "@/types";
import { MOCK_USER_ID, mockBets } from "./mock-bets";

// Mock progressions built from mockBets. A progression ends when a bet is won,
// so its status and dates come from its bets.

const betsOf = (progressionId: number) =>
  mockBets
    .filter((bet) => bet.progression_id === progressionId)
    .sort((a, b) => a.attempt_number - b.attempt_number);

const round = (n: number) => Math.round(n * 100) / 100;

const sum = (
  bets: Bet[],
  field: "amount" | "stake" | "profit" | "profit_units",
) => round(bets.reduce((total, bet) => total + bet[field], 0));

const mockProgression = (id: number): Progression => {
  const bets = betsOf(id);
  const first = bets[0];
  const last = bets[bets.length - 1];
  const status: ProgressionStatus = last.status === "won" ? "won" : "active";

  return {
    id,
    number: id,
    user_id: MOCK_USER_ID,
    status,
    start_date: first.match_date,
    end_date: status === "active" ? null : last.match_date,
    created_at: first.created_at,
  };
};

export const mockProgressions: Progression[] = [
  mockProgression(1), // 4 attempts, won on attempt 4
  mockProgression(2), // 10 attempts, won on attempt 10
];

// Same shape as the progression_stats view: each progression with its totals.
export const mockProgressionStats: ProgressionWithStats[] =
  mockProgressions.map((progression) => {
    const bets = betsOf(progression.id);
    return {
      progression_id: progression.id,
      progression_number: progression.number,
      user_id: progression.user_id,
      status: progression.status,
      start_date: progression.start_date,
      end_date: progression.end_date,
      total_attempts: bets.length,
      total_bet_amount: sum(bets, "amount"),
      total_stake_units: sum(bets, "stake"),
      profit: sum(bets, "profit"),
      profit_units: sum(bets, "profit_units"),
    };
  });
