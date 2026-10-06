import type { DashboardData, ProgressionWithStats } from "@/types";
import { MOCK_USER_ID, UNIT_VALUE, mockBet } from "./mock-bets";

// Mock dashboard for building the layout and styles. It tells one consistent
// story: 15 closed progressions (14 won, 1 abandoned) and an active one on
// attempt 5 with a pending bet. Money is in COP; 1 unit = UNIT_VALUE.

const STARTING_BANK = 2_000_000;

// Active progression: four lost draws, the fifth bet still open.
const currentBets = [
  mockBet({
    id: 101,
    progressionId: 16,
    attempt: 1,
    date: "2026-09-21",
    home: "Sevilla",
    away: "Villarreal",
    stake: 1,
    odds: 3.2,
    drawPercentage: 33,
    result: "home_win",
  }),
  mockBet({
    id: 102,
    progressionId: 16,
    attempt: 2,
    date: "2026-09-23",
    home: "Fiorentina",
    away: "Lazio",
    stake: 1,
    odds: 3.3,
    drawPercentage: 32,
    result: "away_win",
  }),
  mockBet({
    id: 103,
    progressionId: 16,
    attempt: 3,
    date: "2026-09-25",
    home: "Nottingham Forest",
    away: "Brighton",
    stake: 1.5,
    odds: 3.4,
    drawPercentage: 30.5,
    result: "away_win",
  }),
  mockBet({
    id: 104,
    progressionId: 16,
    attempt: 4,
    date: "2026-09-27",
    home: "Stuttgart",
    away: "Hoffenheim",
    stake: 2,
    odds: 3.6,
    drawPercentage: 28.5,
    result: "home_win",
  }),
  mockBet({
    id: 105,
    progressionId: 16,
    attempt: 5,
    date: "2026-10-02",
    home: "Real Sociedad",
    away: "Athletic Club",
    stake: 3,
    odds: 3.3,
    drawPercentage: 33,
    result: null,
  }),
];

const pendingBet = currentBets[currentBets.length - 1];
const investedUnits = currentBets.reduce((total, bet) => total + bet.stake, 0); // 8.5u
const investedAmount = investedUnits * UNIT_VALUE; // $ 85.000

const netProfit = 55_000; // 14 completed (+146.500) − abandoned (−90.000) − current losses (−55.000)
const currentBank = STARTING_BANK + netProfit;

const progressionStats = (
  id: number,
  status: "won" | "abandoned",
  attempts: number,
  units: number,
  profitUnits: number,
  start: string,
  end: string,
): ProgressionWithStats => ({
  progression_id: id,
  progression_number: id,
  user_id: MOCK_USER_ID,
  status,
  start_date: `${start}T18:00:00Z`,
  end_date: `${end}T18:00:00Z`,
  total_attempts: attempts,
  total_bet_amount: units * UNIT_VALUE,
  total_stake_units: units,
  profit: profitUnits * UNIT_VALUE,
  profit_units: profitUnits,
});

export const dashboardData: DashboardData = {
  currentProgression: {
    id: 16,
    number: 16,
    attempt: pendingBet.attempt_number,
    longestProgressionAttempts: 5,
    investedAmount,
    investedUnits,
    bankExposurePercent:
      Math.round((investedAmount / currentBank) * 10_000) / 100, // 4.14
    attemptsBankCanCover: 8,
    currentBet: {
      bet: pendingBet,
      potentialReturn: pendingBet.amount * pendingBet.odds, // $ 99.000
      potentialProfit: pendingBet.amount * (pendingBet.odds - 1), // $ 69.000
    },
    // If attempt 5 loses: recover 8.5u + 1u target at ~3.20 odds.
    nextStake: { units: 4.5, amount: 4.5 * UNIT_VALUE },
    bets: currentBets,
  },

  overview: {
    netProfit,
    netProfitUnits: netProfit / UNIT_VALUE, // 5.5u
    startingBank: STARTING_BANK,
    currentBank, // $ 2.055.000
    bankGrowthPercent: 2.75,
    roiPercent: 9.24, // 5.5u profit / 59.5u staked on settled bets
    totalStaked: 595_000,
    drawHitRatePercent: 31.11, // 14 draws / 45 settled bets
    settledBets: 45,
    progressionsCompleted: 14,
    progressionsAbandoned: 1,
  },

  edge: {
    estimatedDrawRatePercent: 31.4,
    actualDrawRatePercent: 31.11,
    drawRateGapPercent: -0.29,
    averageAdvantagePercent: 1.35,
  },

  nextEvent: null,

  patterns: {
    averageOdds: 3.31,
    averageWinningAttempt: 2.6,
    wonBets: 14,
    highestAttempt: { attempt: 6, progressionNumber: 9 },
    mostCommonScore: { score: "1-1", result: "draw", count: 9, of: 45 },
    mostCommonDrawScore: { score: "1-1", count: 9, of: 14 },
    averageGoals: { perGame: 2.36, games: 45 },
    topBookmakers: [
      { name: "BetPlay", bets: 21 },
      { name: "Betano", bets: 14 },
      { name: "Wplay", bets: 10 },
    ],
  },

  // Cumulative profit after each progression closed, plus today.
  profitOverTime: [
    { date: "2026-05-31T18:00:00Z", cumulativeProfit: 0 },
    { date: "2026-06-06T18:00:00Z", cumulativeProfit: 12_000 },
    { date: "2026-06-08T18:00:00Z", cumulativeProfit: 34_000 },
    { date: "2026-06-18T18:00:00Z", cumulativeProfit: 44_000 },
    { date: "2026-06-24T18:00:00Z", cumulativeProfit: 57_000 },
    { date: "2026-07-08T18:00:00Z", cumulativeProfit: 68_000 },
    { date: "2026-07-15T18:00:00Z", cumulativeProfit: 82_000 },
    { date: "2026-07-18T18:00:00Z", cumulativeProfit: 105_000 },
    { date: "2026-07-29T18:00:00Z", cumulativeProfit: 116_000 },
    { date: "2026-08-10T18:00:00Z", cumulativeProfit: 128_000 },
    { date: "2026-08-16T18:00:00Z", cumulativeProfit: 140_500 },
    { date: "2026-08-26T18:00:00Z", cumulativeProfit: 152_000 },
    {
      date: "2026-09-09T18:00:00Z",
      cumulativeProfit: 62_000,
      note: "#12 · abandoned",
    },
    { date: "2026-09-12T18:00:00Z", cumulativeProfit: 85_500 },
    { date: "2026-09-19T18:00:00Z", cumulativeProfit: 96_500 },
    { date: "2026-09-24T18:00:00Z", cumulativeProfit: 110_000 },
    { date: "2026-09-29T18:00:00Z", cumulativeProfit: 55_000 }, // current progression's losses
  ],

  // Last 5 closed progressions, newest first.
  recentProgressions: [
    progressionStats(15, "won", 2, 2, 1.35, "2026-09-20", "2026-09-24"),
    progressionStats(14, "won", 3, 3.5, 1.1, "2026-09-13", "2026-09-19"),
    progressionStats(13, "won", 1, 1, 2.35, "2026-09-12", "2026-09-12"),
    progressionStats(12, "abandoned", 5, 9, -9, "2026-08-29", "2026-09-09"),
    progressionStats(11, "won", 3, 3.5, 1.15, "2026-08-19", "2026-08-26"),
  ],
};
