"use client";

import { useState, useTransition } from "react";
import Modal from "../ui/Modal";
import { settleBet } from "@/actions/bets/settleBet";
import { formatMoney, withSign } from "@/lib/utils/fn";
import { matchName } from "@/lib/utils/bets";
import type { Bet, SettleOutcome } from "@/types";

type SettleBetModalProps = {
  bet: Bet;
  // Back to the bet, without settling.
  onCancel: () => void;
  onSettled: () => void;
};

// Each outcome with what it means for the bet and the money it moves.
const options = (bet: Bet) =>
  [
    {
      outcome: "draw",
      label: "Draw",
      status: "Won",
      profit: Math.round(bet.amount * (bet.odds - 1) * 100) / 100,
    },
    {
      outcome: "home_win",
      label: "Home win",
      status: "Lost",
      profit: -bet.amount,
    },
    {
      outcome: "away_win",
      label: "Away win",
      status: "Lost",
      profit: -bet.amount,
    },
    { outcome: "void", label: "Void", status: "Stake returned", profit: 0 },
  ] satisfies {
    outcome: SettleOutcome;
    label: string;
    status: string;
    profit: number;
  }[];

const profitClass = (profit: number) =>
  profit > 0 ? "text-green-700" : profit < 0 ? "text-red-700" : "text-gray-500";

const SettleBetModal = ({ bet, onCancel, onSettled }: SettleBetModalProps) => {
  const [outcome, setOutcome] = useState<SettleOutcome | null>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleSettle = () => {
    if (!outcome) return;
    startTransition(async () => {
      setError(null);
      const { error } = await settleBet(bet.id, outcome);
      if (error) return setError(error);
      onSettled();
    });
  };

  return (
    <Modal
      size="md"
      title="Settle bet"
      description={`${matchName(bet)} · how did the match end?`}
      onClose={() => !isPending && onCancel()}
    >
      <div className="flex flex-col gap-5">
        <fieldset className="flex flex-col" disabled={isPending}>
          <legend className="sr-only">Match result</legend>
          {options(bet).map((option) => (
            <label
              key={option.outcome}
              className={`flex cursor-pointer items-center justify-between gap-4 border-b border-gray-200 px-3 py-3 transition-colors first:border-t has-checked:bg-gray-100 hover:bg-gray-50 has-checked:hover:bg-gray-100 has-focus-visible:outline has-focus-visible:outline-black`}
            >
              <span className="flex items-center gap-3">
                <input
                  type="radio"
                  name="outcome"
                  value={option.outcome}
                  checked={outcome === option.outcome}
                  onChange={() => setOutcome(option.outcome)}
                  className="size-3.5 accent-black"
                />
                <span className="flex flex-col">
                  <span className="text-sm text-black">{option.label}</span>
                  <span className="text-xs text-gray-500">{option.status}</span>
                </span>
              </span>
              <span
                className={`font-mono text-sm ${profitClass(option.profit)}`}
              >
                {withSign(option.profit, formatMoney)}
              </span>
            </label>
          ))}
        </fieldset>

        {error && <p className="text-sm text-red-700">{error}</p>}

        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            disabled={isPending}
            className="cursor-pointer rounded-md border border-gray-200 px-4 py-2 text-sm text-black transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSettle}
            disabled={!outcome || isPending}
            className="cursor-pointer rounded-md bg-black px-4 py-2 text-sm text-white transition-colors hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPending ? "Settling…" : "Settle bet"}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default SettleBetModal;
