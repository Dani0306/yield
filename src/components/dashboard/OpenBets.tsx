"use client";

import {
  formatDateTime,
  formatMoney,
  formatPercent,
  formatUnits,
  withSign,
} from "@/lib/utils/fn";
import type { DashboardData } from "@/types";
import { Section } from "./DashboardUI";
import { matchName } from "@/lib/utils/bets";
import { useModal } from "../providers/ModalProvider";
import LiveScore from "./LiveScore";

type OpenBet = DashboardData["openBets"][number];

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

// One open bet, highlighted: it's what's at stake right now.
const OpenBetCard = ({ openBet }: { openBet: OpenBet }) => {
  const { bet, potentialReturn, potentialProfit, liveScore } = openBet;
  const { openModal } = useModal();

  return (
    <section
      aria-label={matchName(bet)}
      className="flex flex-col gap-6 border-t border-gray-200 pt-6"
    >
      <div className="flex items-center justify-between gap-4">
        <span className="flex items-center gap-2 text-xs text-gray-500">
          <span className="size-1.5 shrink-0 rounded-full bg-black" />
          Pending
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

      <LiveScore bet={bet} live={liveScore} />

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
          sub={`Profit ${withSign(potentialProfit, formatMoney)}`}
        />
      </div>
    </section>
  );
};

type OpenBetsProps = {
  openBets: DashboardData["openBets"];
  stake: DashboardData["stake"];
};

// The stake every bet takes, with a shortcut to add one, then each bet
// waiting for its result.
const OpenBets = ({ openBets, stake }: OpenBetsProps) => {
  const { openModal } = useModal();
  const atStake = openBets.reduce((total, { bet }) => total + bet.amount, 0);

  return (
    <Section
      title="Open bets"
      meta={
        openBets.length > 0
          ? `${openBets.length} open · ${formatMoney(atStake)} at stake`
          : undefined
      }
    >
      <div className="flex flex-col gap-12">
        <div className="flex items-center justify-between gap-4 border-t border-gray-200 pt-6">
          <div className="flex flex-col gap-1.5">
            <span className="text-xs text-gray-500">
              Stake per bet · flat, {formatPercent(stake.percent, 1)} of
              bankroll
            </span>
            <span className="font-mono text-base text-black">
              {formatMoney(stake.amount)} · {formatUnits(stake.units)}
            </span>
          </div>
          <button
            type="button"
            onClick={() => openModal("createBet", {})}
            className="shrink-0 cursor-pointer bg-black px-4 py-3 text-sm font-light text-white transition-colors hover:bg-neutral-800"
          >
            Add bet
          </button>
        </div>

        {openBets.length === 0 ? (
          <p className="text-sm text-gray-500">No open bets.</p>
        ) : (
          openBets.map((openBet) => (
            <OpenBetCard key={openBet.bet.id} openBet={openBet} />
          ))
        )}
      </div>
    </Section>
  );
};

export default OpenBets;
