import "server-only";

import { createClient } from "@/lib/supabase/server";
import { getBets } from "@/actions/bets/getBets";
import { getProgressions } from "@/actions/progressions/getProgressions";
import { stakeAfterLosses } from "@/lib/utils/staking";
import type { Bet, DashboardData, ProgressionWithStats } from "@/types";

// Stop counting affordable attempts here; the figure only matters when low.
const MAX_COVERED_ATTEMPTS = 50;

const round = (n: number) => Math.round(n * 100) / 100;
const percent = (part: number, whole: number) =>
  whole === 0 ? 0 : round((part / whole) * 100);

const sum = (bets: Bet[], pick: (bet: Bet) => number) =>
  round(bets.reduce((total, bet) => total + pick(bet), 0));
const average = (bets: Bet[], pick: (bet: Bet) => number) =>
  bets.length === 0 ? 0 : round(sum(bets, pick) / bets.length);

const isSettled = (bet: Bet) => bet.status === "won" || bet.status === "lost";
const isClosed = (p: ProgressionWithStats) =>
  p.status !== "active" && p.end_date;

const getBudget = async () => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("total_budget")
    .single();

  if (error) throw new Error("Error getting the budget");
  return data.total_budget;
};

// Everything the dashboard shows, computed from the user's bets,
// progressions and budget.
export const getDashboardData = async (): Promise<DashboardData> => {
  const [bets, progressions, budget] = await Promise.all([
    getBets(),
    getProgressions(),
    getBudget(),
  ]);

  const settled = bets.filter(isSettled);
  const won = settled.filter((bet) => bet.status === "won");

  // ── Overview ───────────────────────────────────────────────
  // Pending and void bets have a profit of 0, so summing every bet is safe.
  const netProfit = sum(bets, (bet) => bet.profit);
  const totalStaked = sum(settled, (bet) => bet.amount);
  const currentBank = round(budget + netProfit);
  const drawHitRatePercent = percent(won.length, settled.length);

  const overview: DashboardData["overview"] = {
    netProfit,
    netProfitUnits: sum(bets, (bet) => bet.profit_units),
    startingBank: budget,
    currentBank,
    bankGrowthPercent: percent(netProfit, budget),
    roiPercent: percent(netProfit, totalStaked),
    totalStaked,
    drawHitRatePercent,
    settledBets: settled.length,
    progressionsCompleted: progressions.filter((p) => p.status === "won")
      .length,
    progressionsAbandoned: progressions.filter((p) => p.status === "abandoned")
      .length,
  };

  // ── Edge ───────────────────────────────────────────────────
  const estimatedDrawRatePercent = average(
    settled,
    (bet) => bet.draw_percentage,
  );
  const edge: DashboardData["edge"] = {
    estimatedDrawRatePercent,
    actualDrawRatePercent: drawHitRatePercent,
    drawRateGapPercent: round(drawHitRatePercent - estimatedDrawRatePercent),
    averageAdvantagePercent: average(settled, (bet) => bet.advantage),
  };

  // ── Current progression ────────────────────────────────────
  // Progressions come newest first, so this is the latest active one.
  const active = progressions.find((p) => p.status === "active");
  let currentProgression: DashboardData["currentProgression"] = null;

  if (active) {
    const progressionBets = bets
      .filter((bet) => bet.progression_id === active.progression_id)
      .sort((a, b) => a.attempt_number - b.attempt_number);
    const pending = progressionBets.find((bet) => bet.status === "pending");
    const lastAttempt = progressionBets.at(-1)?.attempt_number ?? 0;

    const investedAmount = sum(progressionBets, (bet) => bet.amount);
    const investedUnits = sum(progressionBets, (bet) => bet.stake);

    // Only lost bets raise the stake. The next stake assumes a pending bet
    // loses too.
    const losses =
      progressionBets.filter((bet) => bet.status === "lost").length +
      (pending ? 1 : 0);
    const nextStake = stakeAfterLosses(losses, budget);

    // Keep staking by the rule, as if every bet loses, until the bank runs
    // out. The pending bet's money is already committed.
    let available = currentBank - (pending?.amount ?? 0);
    let attemptsBankCanCover = 0;
    while (budget > 0 && attemptsBankCanCover < MAX_COVERED_ATTEMPTS) {
      const { amount } = stakeAfterLosses(
        losses + attemptsBankCanCover,
        budget,
      );
      if (amount > available) break;
      available -= amount;
      attemptsBankCanCover++;
    }

    currentProgression = {
      id: active.progression_id,
      attempt: pending ? pending.attempt_number : lastAttempt + 1,
      longestProgressionAttempts: Math.max(
        0,
        ...progressions.map((p) => p.total_attempts),
      ),
      investedAmount,
      investedUnits,
      bankExposurePercent: percent(investedAmount, currentBank),
      attemptsBankCanCover,
      currentBet: pending
        ? {
            bet: pending,
            potentialReturn: round(pending.amount * pending.odds),
            potentialProfit: round(pending.amount * (pending.odds - 1)),
          }
        : null,
      nextStake,
      bets: progressionBets,
    };
  }

  // ── Profit over time ───────────────────────────────────────
  // Cumulative profit after each progression closed, oldest first.
  const closed = progressions
    .filter(isClosed)
    .sort((a, b) => a.end_date!.localeCompare(b.end_date!));

  const profitOverTime: DashboardData["profitOverTime"] = [];
  if (progressions.length > 0) {
    const firstStart = progressions.at(-1)!.start_date;
    profitOverTime.push({ date: firstStart, cumulativeProfit: 0 });

    let cumulativeProfit = 0;
    for (const p of closed) {
      cumulativeProfit = round(cumulativeProfit + p.profit);
      profitOverTime.push({
        date: p.end_date!,
        cumulativeProfit,
        note:
          p.status === "won" ? undefined : `#${p.progression_id} · ${p.status}`,
      });
    }

    // Today, when the open progression has moved the total.
    if (netProfit !== cumulativeProfit) {
      profitOverTime.push({
        date: new Date().toISOString(),
        cumulativeProfit: netProfit,
      });
    }
  }

  // ── Recent progressions ────────────────────────────────────
  const recentProgressions = [...closed].reverse().slice(0, 5);

  return {
    currentProgression,
    overview,
    edge,
    profitOverTime,
    recentProgressions,
  };
};
