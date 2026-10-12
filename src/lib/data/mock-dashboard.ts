import type { DashboardData } from "@/types";
import { UNIT_VALUE, mockBet } from "./mock-bets";

// Mock dashboard for building the layout and styles. It tells one consistent
// story: 45 settled bets, the latest at flat stakes, and one bet open.
// Money is in COP; 1 unit = UNIT_VALUE, and the flat stake is 1 unit.

const STARTING_BANK = 2_000_000;

// The latest flat-stake bets, newest first; the first one still open.
const latestBets = [
  mockBet({
    id: 105,
    date: "2026-10-02",
    home: "Real Sociedad",
    away: "Athletic Club",
    stake: 1,
    odds: 3.3,
    drawPercentage: 33,
    result: null,
  }),
  mockBet({
    id: 104,
    date: "2026-09-27",
    home: "Stuttgart",
    away: "Hoffenheim",
    stake: 1,
    odds: 3.6,
    drawPercentage: 28.5,
    result: "draw",
  }),
  mockBet({
    id: 103,
    date: "2026-09-25",
    home: "Nottingham Forest",
    away: "Brighton",
    stake: 1,
    odds: 3.4,
    drawPercentage: 30.5,
    result: "away_win",
  }),
  mockBet({
    id: 102,
    date: "2026-09-23",
    home: "Fiorentina",
    away: "Lazio",
    stake: 1,
    odds: 3.3,
    drawPercentage: 32,
    result: "away_win",
  }),
  mockBet({
    id: 101,
    date: "2026-09-21",
    home: "Sevilla",
    away: "Villarreal",
    stake: 1,
    odds: 3.2,
    drawPercentage: 33,
    result: "home_win",
  }),
];

const pendingBet = latestBets[0];

const netProfit = 55_000;
const currentBank = STARTING_BANK + netProfit;

export const dashboardData: DashboardData = {
  stake: { percent: 0.5, units: 1, amount: UNIT_VALUE },

  openBets: [
    {
      bet: pendingBet,
      potentialReturn: pendingBet.amount * pendingBet.odds, // $ 33.000
      potentialProfit: pendingBet.amount * (pendingBet.odds - 1), // $ 23.000
      liveScore: null,
    },
  ],

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
    settledAverageOdds: 3.31,
    hitRateTimesOdds: 1.03, // 14 / 45 × 3.31
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
    longestWinningRun: 2,
    longestLosingRun: 9,
    mostCommonScore: { score: "1-1", result: "draw", count: 9, of: 45 },
    mostCommonDrawScore: { score: "1-1", count: 9, of: 14 },
    averageGoals: { perGame: 2.36, games: 45 },
    topBookmakers: [
      { name: "BetPlay", bets: 21 },
      { name: "Betano", bets: 14 },
      { name: "Wplay", bets: 10 },
    ],
  },

  // Cumulative profit, one point per settled bet (thinned out here).
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
      note: "Flat stakes",
    },
    { date: "2026-09-12T18:00:00Z", cumulativeProfit: 85_500 },
    { date: "2026-09-19T18:00:00Z", cumulativeProfit: 96_500 },
    { date: "2026-09-24T18:00:00Z", cumulativeProfit: 110_000 },
    { date: "2026-09-29T18:00:00Z", cumulativeProfit: 55_000 },
  ],

  // Settled bets, newest first.
  recentBets: latestBets.slice(1),
};
