import "server-only";

import { createClient } from "@/lib/supabase/server";
import { getBets } from "@/actions/bets/getBets";
import { getBetLiveScore } from "@/actions/bets/getBetLiveScore";
import { getModelResults } from "@/actions/model_results/getModelResults";
import { kickOffTime } from "@/lib/utils/results";
import { flatStake } from "@/lib/utils/staking";
import { outcomeFromScore, parseScore } from "@/lib/utils/bets";
import type { Bet, DashboardData } from "@/types";

// How many settled bets the recent results table shows.
const RECENT_BETS = 10;

const round = (n: number) => Math.round(n * 100) / 100;
const percent = (part: number, whole: number) =>
  whole === 0 ? 0 : round((part / whole) * 100);

const sum = (bets: Bet[], pick: (bet: Bet) => number) =>
  round(bets.reduce((total, bet) => total + pick(bet), 0));
const average = (bets: Bet[], pick: (bet: Bet) => number) =>
  bets.length === 0 ? 0 : round(sum(bets, pick) / bets.length);

// The value that appears most often and how many times. Ties go to the
// value that sorts first ("0-0" before "1-1").
const mostCommon = (values: string[]) => {
  const counts = new Map<string, number>();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  const [top] = [...counts].sort(
    ([a, countA], [b, countB]) => countB - countA || a.localeCompare(b),
  );
  return top ? { value: top[0], count: top[1] } : null;
};

const isSettled = (bet: Bet) => bet.status === "won" || bet.status === "lost";

// Oldest match first; bets on the same kick-off in the order they were added.
const byMatchDate = (a: Bet, b: Bet) =>
  a.match_date.localeCompare(b.match_date) || a.id - b.id;

// The longest run of bets in a row that `matches` (settled bets only, in
// match order).
const longestRun = (settled: Bet[], matches: (bet: Bet) => boolean) => {
  let longest = 0;
  let current = 0;
  for (const bet of settled) {
    current = matches(bet) ? current + 1 : 0;
    longest = Math.max(longest, current);
  }
  return longest;
};

const getProfile = async () => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("total_budget, stake_percent")
    .single();

  if (error) throw new Error("Error getting the bankroll");
  return data;
};

// Everything the dashboard shows, computed from the user's bets and
// bankroll.
export const getDashboardData = async (): Promise<DashboardData> => {
  const [bets, profile, selectedResults] = await Promise.all([
    getBets(),
    getProfile(),
    getModelResults("selected"),
  ]);
  const budget = profile.total_budget;

  // Bets come newest first; runs and the chart read them oldest first.
  const settled = bets.filter(isSettled).sort(byMatchDate);
  const won = settled.filter((bet) => bet.status === "won");

  // ── Overview ───────────────────────────────────────────────
  // Pending and void bets have a profit of 0, so summing every bet is safe.
  const netProfit = sum(bets, (bet) => bet.profit);
  const totalStaked = sum(settled, (bet) => bet.amount);
  const currentBank = round(budget + netProfit);
  const drawHitRatePercent = percent(won.length, settled.length);
  const settledAverageOdds = settled.length
    ? average(settled, (bet) => bet.odds)
    : null;

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
    settledAverageOdds,
    // Exact hit rate, not the rounded %, so 1.03 means 1.03.
    hitRateTimesOdds:
      settledAverageOdds === null
        ? null
        : Math.round((won.length / settled.length) * settledAverageOdds * 1000) /
          1000,
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

  // ── Patterns ───────────────────────────────────────────────
  // Bets per bookmaker, most first; ties in alphabetical order.
  const bookmakerCounts = new Map<string, number>();
  for (const bet of bets)
    bookmakerCounts.set(
      bet.bookmaker,
      (bookmakerCounts.get(bet.bookmaker) ?? 0) + 1,
    );
  const topBookmakers = [...bookmakerCounts]
    .map(([name, count]) => ({ name, bets: count }))
    .sort((a, b) => b.bets - a.bets || a.name.localeCompare(b.name))
    .slice(0, 3);

  // Final scores of settled bets (void bets may have none). A pending bet
  // can hold its match's final score before it's settled; it waits.
  const scores = bets
    .filter((bet) => bet.status !== "pending")
    .map((bet) => (bet.score ? parseScore(bet.score) : null))
    .filter((score) => score !== null);
  const drawScores = scores.filter((s) => s.home === s.away);
  const topScore = mostCommon(scores.map((s) => s.text));
  const topDrawScore = mostCommon(drawScores.map((s) => s.text));
  const totalGoals = scores.reduce((goals, s) => goals + s.home + s.away, 0);

  const patterns: DashboardData["patterns"] = {
    averageOdds: bets.length ? average(bets, (bet) => bet.odds) : null,
    longestWinningRun: longestRun(settled, (bet) => bet.status === "won"),
    longestLosingRun: longestRun(settled, (bet) => bet.status === "lost"),
    topBookmakers,
    mostCommonScore: topScore
      ? {
          score: topScore.value,
          result: outcomeFromScore(parseScore(topScore.value)!),
          count: topScore.count,
          of: scores.length,
        }
      : null,
    mostCommonDrawScore: topDrawScore
      ? {
          score: topDrawScore.value,
          count: topDrawScore.count,
          of: drawScores.length,
        }
      : null,
    averageGoals: scores.length
      ? { perGame: round(totalGoals / scores.length), games: scores.length }
      : null,
  };

  // ── Next event ─────────────────────────────────────────────
  const now = Date.now();
  const betOn = new Set(bets.map((bet) => bet.model_result_id));
  const [next] = selectedResults
    .filter((r) => !betOn.has(r.id) && kickOffTime(r) > now)
    .sort((a, b) => kickOffTime(a) - kickOffTime(b));

  const nextEvent: DashboardData["nextEvent"] = next
    ? {
        resultId: next.id,
        homeTeam: next.home_team,
        awayTeam: next.away_team,
        league: next.league,
        drawPercentage: next.draw_percentage,
        kickOff: new Date(kickOffTime(next)).toISOString(),
        minutesUntil: Math.round((kickOffTime(next) - now) / 60_000),
      }
    : null;

  // ── Open bets ──────────────────────────────────────────────
  // Earliest match first. Each asks the scores API only once its match may
  // be over (see getBetLiveScore).
  const openBets: DashboardData["openBets"] = await Promise.all(
    bets
      .filter((bet) => bet.status === "pending")
      .sort(byMatchDate)
      .map(async (bet) => ({
        bet,
        potentialReturn: round(bet.amount * bet.odds),
        potentialProfit: round(bet.amount * (bet.odds - 1)),
        liveScore: await getBetLiveScore(bet),
      })),
  );

  // ── Profit over time ───────────────────────────────────────
  // Cumulative profit after each settled bet, from 0 at the first one. The
  // first bet without a progression marks the switch to flat stakes.
  const profitOverTime: DashboardData["profitOverTime"] = [];
  if (settled.length > 0) {
    profitOverTime.push({ date: settled[0].match_date, cumulativeProfit: 0 });

    let cumulativeProfit = 0;
    let markedFlat = false;
    for (const bet of settled) {
      cumulativeProfit = round(cumulativeProfit + bet.profit);
      const firstFlat = bet.progression_id === null && !markedFlat;
      if (firstFlat) markedFlat = true;
      profitOverTime.push({
        date: bet.match_date,
        cumulativeProfit,
        note: firstFlat ? "Flat stakes" : undefined,
      });
    }
  }

  return {
    stake: {
      percent: profile.stake_percent,
      ...flatStake(budget, profile.stake_percent),
    },
    openBets,
    overview,
    edge,
    patterns,
    nextEvent,
    profitOverTime,
    recentBets: bets
      .filter((bet) => bet.status !== "pending")
      .slice(0, RECENT_BETS),
  };
};
