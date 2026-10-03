import { formatMoney, withSign } from "@/lib/utils/fn";
import type { Bet, BetResult, BetStatus } from "@/types";

export const statusLabels: Record<BetStatus, string> = {
  pending: "Pending",
  won: "Won",
  lost: "Lost",
  void: "Void",
};

// Unsettled bets read quieter than settled ones.
export const statusClass: Record<BetStatus, string> = {
  pending: "text-gray-500",
  won: "text-gray-900",
  lost: "text-gray-900",
  void: "text-gray-500",
};

export const profitClass = (bet: Bet) => {
  if (bet.status === "pending" || bet.status === "void" || bet.profit === 0)
    return "text-gray-500";
  return bet.profit > 0 ? "text-green-700" : "text-red-700";
};

// Pending bets have no result yet, so they show a dash instead of $ 0.
export const profitText = (bet: Bet) =>
  bet.status === "pending" ? "–" : withSign(bet.profit, formatMoney);

export const matchName = (bet: Bet) => `${bet.home_team} v ${bet.away_team}`;

export const resultLabels: Record<BetResult, string> = {
  home_win: "Home win",
  draw: "Draw",
  away_win: "Away win",
};

// What the bookmaker paid out: stake × odds if won, the stake back if void,
// nothing if lost. null while the bet is still open.
export const betPayout = (bet: Bet): number | null => {
  if (bet.status === "pending") return null;
  if (bet.status === "won") return Math.round(bet.amount * bet.odds * 100) / 100;
  if (bet.status === "void") return bet.amount;
  return 0;
};
