"use client";

import Link from "next/link";
import PageContainer from "../layout/PageContainer";
import { Detail } from "../ui/Details";
import { Section, Stat, StatGrid, signClass } from "../dashboard/DashboardUI";
import ProgressionBetsTable from "../dashboard/ProgressionBetsTable";
import {
  formatDateRange,
  formatDateTime,
  formatMoney,
  formatUnits,
  withSign,
} from "@/lib/utils/fn";
import { matchName } from "@/lib/utils/bets";
import {
  progressionStatusClass,
  progressionStatusLabels,
} from "@/lib/utils/progressions";
import type { Bet, ProgressionWithStats } from "@/types";

type ProgressionContentProps = {
  progression: ProgressionWithStats;
  bets: Bet[];
};

const plural = (count: number, word: string) =>
  `${count} ${word}${count === 1 ? "" : "s"}`;

const mean = (values: number[]) =>
  values.length === 0
    ? null
    : values.reduce((total, value) => total + value, 0) / values.length;

// "6 h", "3 days".
const duration = (startIso: string, endIso: string) => {
  const hours = Math.max(
    0,
    Math.round((Date.parse(endIso) - Date.parse(startIso)) / 3_600_000),
  );
  if (hours < 48) return plural(hours, "hour");
  return plural(Math.round(hours / 24), "day");
};

// One progression: its result, money, odds and every bet in it.
const ProgressionContent = ({ progression, bets }: ProgressionContentProps) => {
  const {
    progression_number: number,
    status,
    start_date,
    end_date,
    total_attempts,
    total_bet_amount,
    total_stake_units,
    profit,
    profit_units,
  } = progression;

  const lost = bets.filter((bet) => bet.status === "lost").length;
  const voided = bets.filter((bet) => bet.status === "void").length;
  const winningBet = bets.find((bet) => bet.status === "won");
  const averageOdds = mean(bets.map((bet) => bet.odds));
  const averageAdvantage = mean(bets.map((bet) => bet.advantage));

  const resultSub = winningBet
    ? `won on attempt ${winningBet.attempt_number}`
    : status === "active"
      ? `attempt ${total_attempts + 1} next`
      : undefined;

  return (
    <PageContainer
      title={`Progression #${number}`}
      description={`${progressionStatusLabels[status]} · ${formatDateRange(start_date, end_date)}`}
      actions={
        <Link
          href="/dashboard"
          className="text-xs text-gray-500 transition-colors hover:text-black"
        >
          ← Dashboard
        </Link>
      }
    >
      <div className="flex flex-col gap-14">
        <Section title="Summary">
          <StatGrid columns={6}>
            <Stat
              label="Result"
              value={progressionStatusLabels[status]}
              valueClassName={progressionStatusClass(status)}
              sub={resultSub}
            />
            <Stat
              label="Attempts"
              value={total_attempts}
              sub={
                total_attempts
                  ? `${lost} lost${voided ? ` · ${voided} void` : ""}`
                  : "no bets yet"
              }
            />
            <Stat
              label="Invested"
              value={formatMoney(total_bet_amount)}
              sub={formatUnits(total_stake_units)}
            />
            <Stat
              label="Profit"
              value={withSign(profit, formatMoney)}
              valueClassName={signClass(profit)}
              sub={withSign(profit_units, formatUnits)}
            />
            <Stat
              label="Average odds"
              value={averageOdds === null ? "–" : averageOdds.toFixed(2)}
              sub={
                total_attempts
                  ? `across ${plural(total_attempts, "bet")}`
                  : undefined
              }
            />
            <Stat
              label="Average advantage"
              value={
                averageAdvantage === null
                  ? "–"
                  : withSign(averageAdvantage, (n) => `${n.toFixed(1)} pts`)
              }
              valueClassName={
                averageAdvantage === null ? "" : signClass(averageAdvantage)
              }
              sub="your estimate vs the odds"
            />
          </StatGrid>
        </Section>

        <ProgressionBetsTable
          title="Bets"
          progressionNumber={number}
          bets={bets}
        />

        <Section title="Details">
          <dl className="grid gap-x-12 border-t border-gray-200 sm:grid-cols-2">
            <div>
              <Detail label="Started" value={formatDateTime(start_date)} />
              <Detail
                label="Ended"
                value={end_date ? formatDateTime(end_date) : "In progress"}
              />
            </div>
            <div>
              <Detail
                label="Duration"
                value={end_date ? duration(start_date, end_date) : "–"}
              />
              <Detail
                label="Winning bet"
                value={
                  winningBet
                    ? `${matchName(winningBet)} · ${winningBet.odds.toFixed(2)}${winningBet.score ? ` · ${winningBet.score}` : ""}`
                    : "–"
                }
              />
            </div>
          </dl>
        </Section>
      </div>
    </PageContainer>
  );
};

export default ProgressionContent;
