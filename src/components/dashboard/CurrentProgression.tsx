"use client";

import Link from "next/link";
import {
  formatDateTime,
  formatMoney,
  formatPercent,
  formatShortDate,
  formatUnits,
  withSign,
} from "@/lib/utils/fn";
import type { DashboardData } from "@/types";
import { Section, Stat, StatGrid } from "./DashboardUI";
import { matchName } from "@/lib/utils/bets";
import { useModal } from "../providers/ModalProvider";
import PageButton from "../ui/PageButton";

type CurrentProgressionData = NonNullable<DashboardData["currentProgression"]>;

const BetFigure = ({
  label,
  value,
  sub,
}: {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
}) => (
  <div className="flex min-w-0 flex-col gap-1.5">
    <span className="text-xs text-gray-500">{label}</span>
    <span className="truncate font-mono text-xl tracking-tight text-black sm:text-2xl">
      {value}
    </span>
    {sub && <span className="truncate text-xs text-gray-500">{sub}</span>}
  </div>
);

// The open bet, highlighted: it's what's at stake right now.
const CurrentBet = ({
  progression,
}: {
  progression: CurrentProgressionData;
}) => {
  const { currentBet, investedAmount } = progression;

  const { openModal } = useModal();

  if (!currentBet) return null;

  const { bet, potentialReturn } = currentBet;
  // What the whole progression nets if this bet wins.
  const progressionResult = potentialReturn - investedAmount;

  return (
    <section aria-label="Current bet" className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <span className="flex items-center gap-2 text-xs text-gray-500">
          <span className="size-1.5 shrink-0 rounded-full bg-black" />
          Current bet · Pending · Attempt {bet.attempt_number}
        </span>
        <button
          type="button"
          onClick={() => openModal("bet", { bet })}
          className="shrink-0 cursor-pointer rounded-md border border-black px-3 py-1.5 text-xs text-black transition-colors hover:bg-gray-100"
        >
          View bet
        </button>
      </div>

      <div className="flex min-w-0 flex-col gap-1">
        <span className="text-2xl font-medium tracking-tight text-black sm:text-3xl">
          {matchName(bet)}
        </span>
        <span className="text-xs text-gray-500">
          {formatDateTime(bet.match_date)} · {bet.bookmaker}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-6 border-t border-gray-200 pt-5 lg:grid-cols-4">
        <BetFigure label="Odds" value={bet.odds.toFixed(2)} />
        <BetFigure
          label="Stake"
          value={formatMoney(bet.amount)}
          sub={formatUnits(bet.stake)}
        />
        <BetFigure
          label="Advantage"
          value={withSign(bet.advantage, (n) => formatPercent(n, 1))}
        />
        <BetFigure
          label="If it wins"
          value={formatMoney(potentialReturn)}
          sub={`Progression ${withSign(progressionResult, formatMoney)}`}
        />
      </div>
    </section>
  );
};

type CurrentProgressionProps = {
  progression: DashboardData["currentProgression"];
  currentBank: number;
};

const CurrentProgression = ({
  progression,
  currentBank,
}: CurrentProgressionProps) => {
  if (!progression) {
    return (
      <Section title="Current progression">
        <div className="flex flex-col items-start gap-4 border-t border-gray-200 pt-6">
          <p className="text-sm text-gray-500">No active progression.</p>
          <PageButton className="text-sm" text="Start progression" />
        </div>
      </Section>
    );
  }

  const startDate = progression.bets[0]?.match_date;

  return (
    <Section
      title="Current progression"
      meta={
        <span className="flex items-center gap-4">
          <span className="max-sm:hidden">
            Active · #{progression.number}
            {startDate && ` · since ${formatShortDate(startDate)}`}
          </span>
          <Link
            href={`/progression/${progression.number}`}
            className="shrink-0 rounded-md border border-black px-3 py-1.5 text-xs text-black transition-colors hover:bg-gray-100"
          >
            Progression details
          </Link>
        </span>
      }
    >
      <div className="flex flex-col gap-12">
        {progression.currentBet ? (
          <CurrentBet progression={progression} />
        ) : (
          <div className="flex items-center justify-between gap-4 border-t border-gray-200 pt-6">
            <div className="flex flex-col gap-1.5">
              <span className="text-xs text-gray-500">Next stake</span>
              <span className="font-mono text-base text-black">
                {formatMoney(progression.nextStake.amount)} ·{" "}
                {formatUnits(progression.nextStake.units)}
              </span>
            </div>
            <Link
              href="/bets/new"
              className="bg-black px-4 py-3 text-sm font-light text-white transition-colors hover:bg-neutral-800"
            >
              Add bet
            </Link>
          </div>
        )}

        <StatGrid columns={4}>
          <Stat
            size="lg"
            label="Current attempt"
            value={progression.attempt}
            sub={`Longest: ${progression.longestProgressionAttempts}`}
          />
          <Stat
            size="lg"
            label="Invested so far"
            value={formatMoney(progression.investedAmount)}
            sub={formatUnits(progression.investedUnits)}
          />
          <Stat
            size="lg"
            label="Bank exposure"
            value={formatPercent(progression.bankExposurePercent, 1)}
            sub={`of ${formatMoney(currentBank)} bank`}
          />
          <Stat
            size="lg"
            label="Bank can cover"
            value={progression.attemptsBankCanCover}
            sub="more losing attempts"
          />
        </StatGrid>
      </div>
    </Section>
  );
};

export default CurrentProgression;
