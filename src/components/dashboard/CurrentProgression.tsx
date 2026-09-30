import Link from "next/link";
import {
  formatDate,
  formatMoney,
  formatPercent,
  formatShortDate,
  formatUnits,
  withSign,
} from "@/lib/utils/fn";
import type { DashboardData } from "@/types";
import { Section, Stat, StatGrid } from "./DashboardUI";
import { matchName } from "./betDisplay";

type CurrentProgressionData = NonNullable<DashboardData["currentProgression"]>;

const Field = ({
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
    <span className="truncate font-mono text-sm text-black">{value}</span>
    {sub && <span className="truncate text-xs text-gray-500">{sub}</span>}
  </div>
);

const Row = ({
  label,
  value,
  sub,
}: {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
}) => (
  <div className="flex flex-col gap-1 border-b border-gray-200 py-3 last:border-b-0">
    <div className="flex items-baseline justify-between gap-4">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="font-mono text-sm text-black">{value}</span>
    </div>
    {sub && <span className="self-end text-xs text-gray-500">{sub}</span>}
  </div>
);

const CurrentBet = ({ progression }: { progression: CurrentProgressionData }) => {
  const { currentBet, investedAmount } = progression;
  if (!currentBet) return null;

  const { bet, potentialReturn } = currentBet;
  // What the whole progression nets if this bet wins.
  const progressionResult = potentialReturn - investedAmount;

  const stake = formatMoney(bet.amount);
  const units = formatUnits(bet.stake);
  const advantage = withSign(bet.advantage, (n) => formatPercent(n, 1));
  const ifWinsSub = `Progression ${withSign(progressionResult, formatMoney)}`;

  return (
    <div className="flex flex-col gap-4 border-t border-gray-200 pt-6">
      <div className="flex items-baseline justify-between gap-4">
        <span className="text-xs text-gray-500">Current bet · Pending</span>
        <Link
          href={`/bets/${bet.id}`}
          className="text-xs text-black underline-offset-4 hover:underline"
        >
          View bet
        </Link>
      </div>

      {/* Desktop */}
      <div className="hidden grid-cols-[2fr_1fr_1.2fr_1fr_1.4fr] gap-6 lg:grid">
        <div className="flex min-w-0 flex-col gap-1.5">
          <span className="text-xs text-gray-500">Match</span>
          <span className="truncate text-base text-black">{matchName(bet)}</span>
          <span className="text-xs text-gray-500">{formatDate(bet.match_date)}</span>
        </div>
        <Field label="Odds" value={bet.odds.toFixed(2)} />
        <Field label="Stake" value={stake} sub={units} />
        <Field label="Advantage" value={advantage} />
        <Field label="If it wins" value={formatMoney(potentialReturn)} sub={ifWinsSub} />
      </div>

      {/* Mobile */}
      <div className="flex flex-col lg:hidden">
        <span className="text-base text-black">{matchName(bet)}</span>
        <span className="mb-2 text-xs text-gray-500">{formatDate(bet.match_date)}</span>
        <Row label="Odds" value={bet.odds.toFixed(2)} />
        <Row label="Stake" value={`${stake} · ${units}`} />
        <Row label="Advantage" value={advantage} />
        <Row label="If it wins" value={formatMoney(potentialReturn)} sub={ifWinsSub} />
      </div>
    </div>
  );
};

type CurrentProgressionProps = {
  progression: DashboardData["currentProgression"];
  currentBank: number;
};

const CurrentProgression = ({ progression, currentBank }: CurrentProgressionProps) => {
  if (!progression) {
    return (
      <Section title="Current progression">
        <div className="flex flex-col items-start gap-4 border-t border-gray-200 pt-6">
          <p className="text-sm text-gray-500">No active progression.</p>
          <Link
            href="/bets/new"
            className="bg-black px-4 py-3 text-sm font-light text-white transition-colors hover:bg-neutral-800"
          >
            Start progression
          </Link>
        </div>
      </Section>
    );
  }

  const startDate = progression.bets[0]?.match_date;

  return (
    <Section
      title="Current progression"
      meta={`Active · #${progression.id}${startDate ? ` · since ${formatShortDate(startDate)}` : ""}`}
    >
      <div className="flex flex-col gap-6">
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
      </div>
    </Section>
  );
};

export default CurrentProgression;
