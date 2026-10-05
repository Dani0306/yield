"use client";

import { useState } from "react";
import Modal from "../ui/Modal";
import { Detail, SectionTitle } from "../ui/Details";
import DeleteBetModal from "./DeleteBetModal";
import SettleBetModal from "./SettleBetModal";
import {
  formatDateTime,
  formatMoney,
  formatPercent,
  formatUnits,
  withSign,
} from "@/lib/utils/fn";
import {
  betPayout,
  matchName,
  profitClass,
  profitText,
  resultLabels,
  statusLabels,
} from "@/lib/utils/bets";
import type { Bet } from "@/types";

type BetModalProps = {
  bet: Bet;
  onClose: () => void;
  // Shows as disabled until editing is built.
  onEdit?: (bet: Bet) => void;
};

// Delete and settle ask first, in a smaller modal on top of this one.
type Step = "details" | "delete" | "settle";

const ResultCell = ({
  label,
  value,
  valueClassName = "text-black",
}: {
  label: string;
  value: React.ReactNode;
  valueClassName?: string;
}) => (
  <div className="flex flex-col gap-2 py-4 sm:px-6 sm:first:pl-0">
    <span className="text-xs text-gray-500">{label}</span>
    <span
      className={`font-mono text-xl tracking-tight sm:text-2xl ${valueClassName}`}
    >
      {value}
    </span>
  </div>
);

// Muted green/red for the advantage; neutral when zero.
const signClass = (value: number) =>
  value > 0 ? "text-green-700" : value < 0 ? "text-red-700" : "text-black";

const pointsText = (value: number) =>
  withSign(value, (n) => `${n.toFixed(1)} pts`);

const ProbabilityBar = ({
  label,
  value,
  scaleMax,
  fillClassName,
}: {
  label: string;
  value: number;
  scaleMax: number;
  fillClassName: string;
}) => (
  <div className="flex items-center gap-4">
    <span className="w-20 shrink-0 text-xs text-gray-500">{label}</span>
    <div className="h-1 flex-1 bg-gray-100">
      <div
        className={`h-full ${fillClassName}`}
        style={{ width: `${Math.min((value / scaleMax) * 100, 100)}%` }}
      />
    </div>
  </div>
);

// The reason the bet exists: your draw estimate against the one the odds imply.
const EdgeHighlight = ({ bet }: { bet: Bet }) => {
  const implied = 100 / bet.odds;
  const estimate = bet.draw_percentage;
  // Both bars share a scale with headroom, so the gap is easy to see.
  const scaleMax = Math.max(
    50,
    Math.ceil(Math.max(estimate, implied) / 10) * 10,
  );
  const verdict =
    bet.advantage > 0
      ? "You rate the draw more likely than the bookmaker does."
      : bet.advantage < 0
        ? "The bookmaker rates the draw more likely than you do: no edge on this bet."
        : "You and the bookmaker rate the draw the same.";

  return (
    <section className="flex flex-col gap-5 rounded-md border border-gray-200 p-5">
      <div className="grid grid-cols-2 gap-6 sm:grid-cols-3">
        <div className="flex flex-col gap-1.5">
          <span className="text-xs text-gray-500">Your draw estimate</span>
          <span className="font-mono text-3xl tracking-tight text-black sm:text-4xl">
            {formatPercent(estimate, 1)}
          </span>
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="text-xs text-gray-500">Implied by odds</span>
          <span className="font-mono text-3xl tracking-tight text-gray-400 sm:text-4xl">
            {formatPercent(implied, 1)}
          </span>
          <span className="font-mono text-xs text-gray-500">
            100 / {bet.odds.toFixed(2)}
          </span>
        </div>
        <div className="col-span-2 flex flex-col gap-1.5 border-t border-gray-200 pt-4 sm:col-span-1 sm:border-t-0 sm:border-l sm:pt-0 sm:pl-6">
          <span className="text-xs text-gray-500">Advantage</span>
          <span
            className={`font-mono text-3xl tracking-tight sm:text-4xl ${signClass(bet.advantage)}`}
          >
            {pointsText(bet.advantage)}
          </span>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <ProbabilityBar
          label="Your estimate"
          value={estimate}
          scaleMax={scaleMax}
          fillClassName="bg-black"
        />
        <ProbabilityBar
          label="Implied"
          value={implied}
          scaleMax={scaleMax}
          fillClassName="bg-gray-400"
        />
      </div>
      <p className="text-xs text-gray-500">{verdict}</p>
    </section>
  );
};

const BetModal = ({ bet, onClose, onEdit }: BetModalProps) => {
  const [step, setStep] = useState<Step>("details");
  const isPending = bet.status === "pending";
  const payout = betPayout(bet);

  const actions = (
    <>
      <button
        onClick={() => setStep("delete")}
        className="cursor-pointer px-2 py-2 text-xs text-gray-500 transition-colors hover:text-black disabled:cursor-not-allowed disabled:opacity-50"
      >
        Delete
      </button>
      <button
        onClick={() => onEdit?.(bet)}
        disabled={!onEdit}
        className="cursor-pointer rounded-md border border-black px-4 py-2 text-sm text-black transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Edit
      </button>
      {isPending && (
        <button
          onClick={() => setStep("settle")}
          className="cursor-pointer rounded-md bg-black px-4 py-2 text-sm text-white transition-colors hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Settle bet
        </button>
      )}
    </>
  );

  // The confirm modals are siblings, not children, of the bet's <dialog>:
  // closing one must not bubble a close event up to the bet modal.
  return (
    <>
      <Modal
        size="xl"
        className="p-4"
        onClose={onClose}
        eyebrow={`Progression #${bet.progression_number} · Attempt ${bet.attempt_number} · #${String(bet.id).padStart(4, "0")}`}
        title={matchName(bet)}
        titleSize="lg"
        description={
          <>
            <span className="text-black">{statusLabels[bet.status]}</span> ·{" "}
            {formatDateTime(bet.match_date)}
          </>
        }
        actions={actions}
      >
        <div className="flex flex-col gap-10 pt-4">
          <EdgeHighlight bet={bet} />

          <section className="flex flex-col">
            <SectionTitle>Details</SectionTitle>
            <dl className="grid gap-x-12 sm:grid-cols-2">
              <div>
                <Detail
                  label="Date & time"
                  value={formatDateTime(bet.match_date)}
                />
                <Detail label="Match" value={matchName(bet)} />
                <Detail label="Selection" value="Draw" />
                <Detail label="Bookmaker" value={bet.bookmaker} />
                <Detail label="Placed" value={formatDateTime(bet.created_at)} />
              </div>
              <div>
                <Detail label="Odds" value={bet.odds.toFixed(2)} mono />
                <Detail label="Stake" value={formatMoney(bet.amount)} mono />
                <Detail label="Units" value={formatUnits(bet.stake)} mono />
                <Detail
                  label="Progression"
                  value={`#${bet.progression_number} · attempt ${bet.attempt_number}`}
                  mono
                />
              </div>
            </dl>
          </section>

          <section className="flex flex-col">
            <SectionTitle>Result</SectionTitle>
            <div className="grid divide-gray-200 border-b border-gray-200 max-sm:divide-y sm:grid-cols-3 sm:divide-x">
              <ResultCell
                label="Final result"
                value={
                  bet.result ? (
                    <>
                      {resultLabels[bet.result]}
                      {bet.score && (
                        <span className="ml-3 text-gray-500">{bet.score}</span>
                      )}
                    </>
                  ) : (
                    "–"
                  )
                }
                valueClassName={bet.result ? "text-black" : "text-gray-500"}
              />
              <ResultCell
                label="Payout"
                value={payout === null ? "–" : formatMoney(payout)}
                valueClassName={
                  payout === null ? "text-gray-500" : "text-black"
                }
              />
              <ResultCell
                label="Profit"
                value={profitText(bet)}
                valueClassName={profitClass(bet)}
              />
            </div>
          </section>
        </div>
      </Modal>

      {step === "delete" && (
        <DeleteBetModal
          bet={bet}
          onCancel={() => setStep("details")}
          onDeleted={onClose}
        />
      )}
      {step === "settle" && (
        <SettleBetModal
          bet={bet}
          onCancel={() => setStep("details")}
          onSettled={onClose}
        />
      )}
    </>
  );
};

export default BetModal;
